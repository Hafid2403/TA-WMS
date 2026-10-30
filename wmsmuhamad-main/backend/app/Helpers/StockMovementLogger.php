<?php

namespace App\Helpers;

use App\Models\Stock;
use App\Models\StockMovement;
use Illuminate\Support\Facades\Auth;

class StockMovementLogger
{
    /**
     * Log an inventory mutation.
     */
    public static function log(
        int $productId,
        int $warehouseId,
        string $movementType,
        string $referenceNumber,
        int $qtyChange,
        string $zone,
        string $rack,
        string $bin,
        ?string $notes = null,
        ?int $userId = null
    ): void {
        // Auto resolve operator
        if (!$userId) {
            $userId = Auth::id();
        }

        // Fetch current stock at that exact shelf location
        $stock = Stock::where('warehouse_id', $warehouseId)
            ->where('product_id', $productId)
            ->where('zone', $zone)
            ->where('rack', $rack)
            ->where('bin', $bin)
            ->first();

        $qtyBefore = $stock ? $stock->qty_available : 0;
        $qtyAfter = $qtyBefore + $qtyChange;

        StockMovement::create([
            'product_id' => $productId,
            'warehouse_id' => $warehouseId,
            'user_id' => $userId,
            'movement_type' => $movementType,
            'reference_number' => $referenceNumber,
            'qty_change' => $qtyChange,
            'qty_before' => $qtyBefore,
            'qty_after' => $qtyAfter,
            'zone' => $zone,
            'rack' => $rack,
            'bin' => $bin,
            'notes' => $notes,
        ]);
    }
}
