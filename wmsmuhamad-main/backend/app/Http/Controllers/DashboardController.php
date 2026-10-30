<?php

namespace App\Http\Controllers;

use App\Models\Product;
use App\Models\Stock;
use App\Models\MaterialRequest;
use App\Models\StockOpname;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Symfony\Component\HttpFoundation\Response;

class DashboardController extends Controller
{
    /**
     * Get aggregate statistics for the WMS system dashboard.
     */
    public function summary(Request $request)
    {
        $user = $request->user();
        $warehouseId = $user->warehouse_id;

        // Base query for stock monitor
        $stockQuery = Stock::query();
        $mrQuery = MaterialRequest::query();
        $opnameQuery = StockOpname::query();

        // If user is restricted to a warehouse (not system-wide admin)
        if ($warehouseId) {
            $stockQuery->where('warehouse_id', $warehouseId);
            $mrQuery->where('warehouse_id', $warehouseId);
            $opnameQuery->where('warehouse_id', $warehouseId);
        }

        // 1. Total SKU Count
        $totalSKUs = Product::where('is_active', true)->count();

        // 2. Total Stocks Available
        $totalAvailableQty = (int) $stockQuery->sum('qty_available');

        // 3. Pending Material Requests
        $pendingRequests = $mrQuery->where('status', 'pending')->count();

        // 4. Active Stock Opnames
        $activeOpnames = $opnameQuery->whereIn('status', ['draft', 'in_progress'])->count();

        // 5. Critical Low Stock Alerts count and items
        // Join stock with products to evaluate min_stock breach
        $criticalItemsQuery = DB::table('stock')
            ->join('products', 'stock.product_id', '=', 'products.product_id')
            ->join('warehouses', 'stock.warehouse_id', '=', 'warehouses.warehouse_id')
            ->select(
                'products.product_name',
                'products.internal_code',
                'products.unit',
                'products.min_stock',
                'stock.qty_available',
                'warehouses.warehouse_name'
            )
            ->where('products.is_active', true)
            ->whereRaw('stock.qty_available <= products.min_stock');

        if ($warehouseId) {
            $criticalItemsQuery->where('stock.warehouse_id', $warehouseId);
        }

        $criticalItems = $criticalItemsQuery->get();
        $criticalCount = $criticalItems->count();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_skus' => $totalSKUs,
                'total_available_stock' => $totalAvailableQty,
                'pending_material_requests' => $pendingRequests,
                'active_stock_opnames' => $activeOpnames,
                'critical_low_stock_count' => $criticalCount,
                'critical_items' => $criticalItems,
            ]
        ], Response::HTTP_OK);
    }
}
