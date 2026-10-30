<?php

namespace App\Http\Controllers;

use App\Models\MaterialRequest;
use App\Models\MaterialRequestItem;
use App\Models\Stock;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class MaterialRequestController extends Controller
{
    /**
     * List all material requests with eager loaded relations.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = MaterialRequest::with(['warehouse', 'department', 'approver', 'items.product.stocks']);

        if ($user->warehouse_id) {
            $query->where('warehouse_id', $user->warehouse_id);
        }

        $requests = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests
        ], Response::HTTP_OK);
    }

    /**
     * Display a specific material request and its line items.
     */
    public function show($id)
    {
        $mr = MaterialRequest::with(['warehouse', 'department', 'approver', 'items.product.stocks'])
            ->find($id);

        if (!$mr) {
            return response()->json([
                'status' => 'error',
                'message' => 'Material request not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status' => 'success',
            'data' => $mr
        ], Response::HTTP_OK);
    }

    /**
     * Submit a new material request for department consumption.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'department_id' => 'required|exists:departments,department_id',
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'requested_by' => 'required|string|max:100',
            'request_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.qty_requested' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        // Enforce warehouse boundary access control
        if ($user->warehouse_id && (int)$request->warehouse_id !== (int)$user->warehouse_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized warehouse access.',
            ], Response::HTTP_FORBIDDEN);
        }

        $mr = DB::transaction(function () use ($request, $user) {
            // Generate unique Material Request number
            $latest = MaterialRequest::latest('mr_id')->first();
            $nextId = $latest ? $latest->mr_id + 1 : 1;
            $mrNumber = 'MR-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $newMr = MaterialRequest::create([
                'mr_number' => $mrNumber,
                'warehouse_id' => $request->warehouse_id,
                'department_id' => $request->department_id,
                'requested_by' => $request->requested_by,
                'request_date' => $request->request_date,
                'status' => 'pending',
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                MaterialRequestItem::create([
                    'mr_id' => $newMr->mr_id,
                    'product_id' => $item['product_id'],
                    'qty_requested' => $item['qty_requested'],
                    'qty_fulfilled' => 0,
                ]);
            }

            // Log activity log
            ActivityLogger::log('MATERIAL_REQUEST_SUBMIT', "Operator created Material Request {$mrNumber} for department ID {$request->department_id}.");

            return $newMr;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Material request submitted successfully and is pending approval.',
            'data' => $mr->load('items')
        ], Response::HTTP_CREATED);
    }

    /**
     * Approve a material request and deduct stocks (Master-only).
     */
    public function approve(Request $request, $id)
    {
        $mr = MaterialRequest::with('items')->find($id);

        if (!$mr) {
            return response()->json([
                'status' => 'error',
                'message' => 'Material request not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($mr->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'This request is already ' . $mr->status . '.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        try {
            DB::transaction(function () use ($mr, $user) {
                foreach ($mr->items as $item) {
                    $stock = Stock::where('warehouse_id', $mr->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->lockForUpdate() // Lock row for stock checking and deduction
                        ->first();

                    if (!$stock || $stock->qty_available < $item->qty_requested) {
                        $available = $stock ? $stock->qty_available : 0;
                        throw new \Exception("Insufficient stock for Product ID {$item->product_id} in the warehouse. Requested: {$item->qty_requested}, Available: {$available}.");
                    }

                    // Deduct stock and increment fulfilled amount
                    $stock->decrement('qty_available', $item->qty_requested);
                    
                    $item->update([
                        'qty_fulfilled' => $item->qty_requested
                    ]);

                    // Log physical stock movement
                    \App\Helpers\StockMovementLogger::log(
                        $item->product_id,
                        $mr->warehouse_id,
                        'OUTBOUND',
                        $mr->mr_number,
                        -$item->qty_requested,
                        $stock->zone,
                        $stock->rack,
                        $stock->bin,
                        'Material Request Approved Issue',
                        $user->id
                    );
                }

                // Update request status
                $mr->update([
                    'status' => 'completed',
                    'approved_by' => $user->id,
                    'approved_date' => now(),
                ]);

                // Log system activity log
                \App\Helpers\ActivityLogger::log(
                    'MATERIAL_REQUEST_APPROVE',
                    "Master Administrator {$user->name} approved Material Request {$mr->mr_number} and deducted items from stock balance.",
                    $user->id
                );
            });

            return response()->json([
                'status' => 'success',
                'message' => 'Material request approved and stocks deducted successfully.',
            ], Response::HTTP_OK);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => $e->getMessage(),
            ], Response::HTTP_BAD_REQUEST);
        }
    }

    /**
     * Reject a material request (Master-only).
     */
    public function reject(Request $request, $id)
    {
        $mr = MaterialRequest::find($id);

        if (!$mr) {
            return response()->json([
                'status' => 'error',
                'message' => 'Material request not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if ($mr->status !== 'pending') {
            return response()->json([
                'status' => 'error',
                'message' => 'This request is already ' . $mr->status . '.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validator = Validator::make($request->all(), [
            'reason' => 'required|string|max:255',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Reason notes is required for rejection.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        $mr->update([
            'status' => 'rejected',
            'approved_by' => $user->id,
            'approved_date' => now(),
            'notes' => $mr->notes ? $mr->notes . " | Rejection Reason: " . $request->reason : "Rejection Reason: " . $request->reason,
        ]);

        // Log activity log
        ActivityLogger::log('MATERIAL_REQUEST_REJECT', "Master Administrator {$user->name} rejected Material Request {$mr->mr_number}. Reason: {$request->reason}.", $user->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Material request successfully rejected.',
        ], Response::HTTP_OK);
    }
}
