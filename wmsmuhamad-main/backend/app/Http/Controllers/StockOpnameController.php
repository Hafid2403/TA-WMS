<?php

namespace App\Http\Controllers;

use App\Models\Stock;
use App\Models\StockOpname;
use App\Models\StockOpnameItem;
use App\Models\StockAdjustment;
use App\Helpers\ActivityLogger;
use App\Helpers\StockMovementLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;
use Symfony\Component\HttpFoundation\Response;

class StockOpnameController extends Controller
{
    /**
     * List all stock opname audit sessions.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = StockOpname::with(['warehouse', 'conductor', 'approver']);

        if ($user->warehouse_id) {
            $query->where('warehouse_id', $user->warehouse_id);
        }

        $sessions = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $sessions
        ], Response::HTTP_OK);
    }

    /**
     * Display details of a specific opname session and counts.
     */
    public function show($id)
    {
        $session = StockOpname::with(['warehouse', 'conductor', 'approver', 'items.product.category', 'items.product.stocks'])
            ->find($id);

        if (!$session) {
            return response()->json([
                'status' => 'error',
                'message' => 'Stock opname session not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status' => 'success',
            'data' => $session
        ], Response::HTTP_OK);
    }

    /**
     * Start a new stock opname session.
     */
    public function start(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        // Ensure user can only audit their assigned warehouse
        if ($user->warehouse_id && $user->warehouse_id !== (int) $request->warehouse_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden. You can only start stock opnames for your assigned warehouse.',
            ], Response::HTTP_FORBIDDEN);
        }

        $session = StockOpname::create([
            'warehouse_id' => $request->warehouse_id,
            'conducted_by' => $user->id,
            'start_date' => now(),
            'status' => 'in_progress',
            'notes' => $request->notes,
        ]);

        // Log system activity log
        ActivityLogger::log('STOCK_OPNAME_START', "Operator {$user->name} started stock opname session ID {$session->opname_id} for warehouse ID {$request->warehouse_id}.", $user->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Stock opname session started successfully.',
            'data' => $session
        ], Response::HTTP_CREATED);
    }

    /**
     * Save physical counts and evaluate stock discrepancies.
     */
    public function saveCounts(Request $request, $id)
    {
        $session = StockOpname::find($id);

        if (!$session) {
            return response()->json([
                'status' => 'error',
                'message' => 'Stock opname session not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($session->status !== 'in_progress') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot record counts. Session is currently ' . $session->status . '.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validator = Validator::make($request->all(), [
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.physical_qty' => 'required|integer|min:0',
            'items.*.notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        DB::transaction(function () use ($request, $session) {
            foreach ($request->items as $item) {
                // Determine current system quantity
                $stock = Stock::where('warehouse_id', $session->warehouse_id)
                    ->where('product_id', $item['product_id'])
                    ->first();

                $systemQty = $stock ? $stock->qty_available : 0;
                $physicalQty = (int) $item['physical_qty'];
                $discrepancy = $physicalQty - $systemQty;

                StockOpnameItem::create([
                    'opname_id' => $session->opname_id,
                    'product_id' => $item['product_id'],
                    'system_qty' => $systemQty,
                    'physical_qty' => $physicalQty,
                    'discrepancy' => $discrepancy,
                    'notes' => $item['notes'] ?? null,
                ]);
            }

            // Update session status to completed (counts gathered, pending Master approval)
            $session->update([
                'status' => 'completed',
                'end_date' => now(),
            ]);

            // Log activity log
            ActivityLogger::log('STOCK_OPNAME_RECORD_COUNTS', "Operator recorded physical counts sheet for stock opname session ID {$session->opname_id}. Counts are submitted for reconciliation.", Auth::id());
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Physical counts recorded successfully. Discrepancies computed and pending administrative approval.',
        ], Response::HTTP_OK);
    }

    /**
     * Approve stock opname findings and commit adjustments (Master-only).
     */
    public function approve(Request $request, $id)
    {
        $session = StockOpname::with('items')->find($id);

        if (!$session) {
            return response()->json([
                'status' => 'error',
                'message' => 'Stock opname session not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($session->status !== 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot approve. Session status is ' . $session->status . ' (expected completed).',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        if ($user->warehouse_id && (int)$session->warehouse_id !== (int)$user->warehouse_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden. You do not have access to this warehouse.',
            ], Response::HTTP_FORBIDDEN);
        }

        $approvalNotes = $request->input('notes') ?: $request->input('approval_notes');

        DB::transaction(function () use ($session, $user, $approvalNotes) {
            foreach ($session->items as $item) {
                // Find stock or create if missing
                $stock = Stock::where('warehouse_id', $session->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                $qtyBefore = $stock ? $stock->qty_available : 0;

                // Log adjustment audit details
                StockAdjustment::create([
                    'opname_id' => $session->opname_id,
                    'product_id' => $item->product_id,
                    'warehouse_id' => $session->warehouse_id,
                    'qty_before' => $qtyBefore,
                    'qty_after' => $item->physical_qty,
                    'adjusted_by' => $user->id,
                    'adjustment_date' => now(),
                    'reason' => "Stock Opname Audit Adjustment. Discrepancy logged: " . ($item->discrepancy >= 0 ? "+" : "") . $item->discrepancy,
                ]);

                // Update physical stock balance
                if ($stock) {
                    $stock->update([
                        'qty_available' => $item->physical_qty
                    ]);
                } else {
                    Stock::create([
                        'warehouse_id' => $session->warehouse_id,
                        'product_id' => $item->product_id,
                        'qty_available' => $item->physical_qty,
                        'qty_reserved' => 0,
                        'zone' => 'Default',
                        'rack' => 'Default',
                        'bin' => 'Default',
                    ]);
                }

                // Log physical stock movements discrepancy adjustments
                StockMovementLogger::log(
                    $item->product_id,
                    $session->warehouse_id,
                    'ADJUSTMENT',
                    'SO-' . str_pad($session->opname_id, 4, '0', STR_PAD_LEFT),
                    $item->discrepancy,
                    $stock ? $stock->zone : 'Default',
                    $stock ? $stock->rack : 'Default',
                    $stock ? $stock->bin : 'Default',
                    "Stock Opname discrepancy adjusted: " . ($item->discrepancy >= 0 ? "+" : "") . $item->discrepancy,
                    $user->id
                );
            }

            $newNotes = $session->notes;
            if ($approvalNotes) {
                $newNotes = $newNotes ? $newNotes . " | Approval Notes: " . $approvalNotes : "Approval Notes: " . $approvalNotes;
            }

            // Update session status to approved
            $session->update([
                'status' => 'approved',
                'approved_by' => $user->id,
                'notes' => $newNotes,
            ]);

            // Log activity log
            ActivityLogger::log('STOCK_OPNAME_APPROVE', "Master Administrator {$user->name} reconciled and approved stock opname session ID {$session->opname_id}. Stock levels updated.", $user->id);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Stock opname approved successfully. Stock balances updated, and adjustment logs created.',
        ], Response::HTTP_OK);
    }

    public function reject(Request $request, $id)
    {
        $user = $request->user();
        if (!$user->isMaster()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya Administrator Utama (Master) yang dapat menolak audit stock opname.',
            ], Response::HTTP_FORBIDDEN);
        }

        $session = StockOpname::findOrFail($id);

        if ($user->warehouse_id && (int)$session->warehouse_id !== (int)$user->warehouse_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden. You do not have access to this warehouse.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($session->status !== 'completed') {
            return response()->json([
                'status' => 'error',
                'message' => 'Hanya audit yang selesai dihitung (Completed) yang dapat ditolak.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $request->validate([
            'notes' => 'required|string|max:500',
        ]);

        $rejectionNotes = $request->input('notes');
        $newNotes = $session->notes;
        if ($rejectionNotes) {
            $newNotes = $newNotes ? $newNotes . " | Rejection Notes: " . $rejectionNotes : "Rejection Notes: " . $rejectionNotes;
        }

        $session->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'notes' => $newNotes,
        ]);

        // Log activity log
        ActivityLogger::log('STOCK_OPNAME_REJECT', "Master Administrator {$user->name} menolak laporan audit stock opname session ID {$session->opname_id}. Catatan: {$rejectionNotes}", $user->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Laporan stock opname berhasil ditolak.',
        ], Response::HTTP_OK);
    }
}
