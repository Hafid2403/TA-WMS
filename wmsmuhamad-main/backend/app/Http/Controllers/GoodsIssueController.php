<?php

namespace App\Http\Controllers;

use App\Models\GoodsIssue;
use App\Models\GoodsIssueItem;
use App\Models\MaterialRequest;
use App\Models\Stock;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class GoodsIssueController extends Controller
{
    /**
     * List all Goods Issues with parent Material Request.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = GoodsIssue::with(['materialRequest', 'warehouse', 'operator', 'items.product']);

        if ($user->warehouse_id) {
            $query->where('warehouse_id', $user->warehouse_id);
        }

        $issues = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $issues
        ], Response::HTTP_OK);
    }

    /**
     * Store a new physical Goods Issue withdrawal.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'mr_id' => 'required|exists:material_requests,mr_id',
            'issue_date' => 'required|date',
            'notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $mr = MaterialRequest::with('items')->findOrFail($request->mr_id);

        $user = $request->user();

        // Enforce warehouse boundary access control
        if ($user->warehouse_id && (int)$mr->warehouse_id !== (int)$user->warehouse_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized warehouse access.',
            ], Response::HTTP_FORBIDDEN);
        }

        if ($mr->status !== 'completed' && $mr->status !== 'approved') {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot issue materials. Request status must be approved or completed (current status: ' . $mr->status . ').',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $gi = DB::transaction(function () use ($request, $mr, $user) {
            $latest = GoodsIssue::latest('gi_id')->first();
            $nextId = $latest ? $latest->gi_id + 1 : 1;
            $giNumber = 'GI-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            // 1. Create Goods Issue document
            $issue = GoodsIssue::create([
                'gi_number' => $giNumber,
                'mr_id' => $mr->mr_id,
                'warehouse_id' => $mr->warehouse_id,
                'issued_by' => $user->id,
                'issue_date' => $request->issue_date,
                'notes' => $request->notes,
            ]);

            // 2. Map Material Request Items into Goods Issue Items
            foreach ($mr->items as $item) {
                GoodsIssueItem::create([
                    'gi_id' => $issue->gi_id,
                    'product_id' => $item->product_id,
                    'qty_issued' => $item->qty_fulfilled > 0 ? $item->qty_fulfilled : $item->qty_requested,
                ]);
            }

            // 3. Mark MR as completed if approved
            if ($mr->status === 'approved') {
                $mr->update(['status' => 'completed']);
            }

            // Log activity
            ActivityLogger::log('GOODS_ISSUE_SUBMIT', "Issued stock withdrawal {$giNumber} for Material Request {$mr->mr_number}.");

            return $issue;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Goods Issue created successfully and items withdrawn from stock ledger.',
            'data' => $gi->load('items')
        ], Response::HTTP_CREATED);
    }
}
