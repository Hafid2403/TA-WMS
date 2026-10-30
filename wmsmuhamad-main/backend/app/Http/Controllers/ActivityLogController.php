<?php

namespace App\Http\Controllers;

use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class ActivityLogController extends Controller
{
    /**
     * List all system activity audit logs (Master-only).
     */
    public function index(Request $request)
    {
        $logs = ActivityLog::with('user.role')
            ->orderBy('created_at', 'desc')
            ->paginate(50);

        return response()->json([
            'status' => 'success',
            'data' => $logs
        ], Response::HTTP_OK);
    }

    /**
     * Get a comprehensive stock movement history for ledger reporting.
     */
    public function stockMovements(Request $request)
    {
        $query = \App\Models\StockMovement::with(['product', 'warehouse', 'user.role']);

        // Filter by warehouse if requested
        $warehouseId = $request->input('warehouse_id');
        if ($warehouseId) {
            $query->where('warehouse_id', $warehouseId);
        }

        $movements = $query->orderBy('created_at', 'desc')->get();

        // Map format for frontend ease of rendering
        $formatted = $movements->map(function ($m) {
            return [
                'movement_id' => $m->movement_id,
                'movement_type' => $m->movement_type,
                'transaction_number' => $m->reference_number,
                'product_name' => $m->product ? $m->product->product_name : 'Unknown Product',
                'internal_code' => $m->product ? $m->product->internal_code : 'N/A',
                'warehouse_name' => $m->warehouse ? $m->warehouse->warehouse_name : 'Unknown Warehouse',
                'qty' => $m->qty_change,
                'qty_before' => $m->qty_before,
                'qty_after' => $m->qty_after,
                'zone' => $m->zone,
                'rack' => $m->rack,
                'bin' => $m->bin,
                'date' => $m->created_at,
                'notes' => $m->notes,
                'operator_name' => $m->user ? $m->user->name : 'System / Auto-Process',
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $formatted
        ], Response::HTTP_OK);
    }
}
