<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockAdjustment extends Model
{
    protected $table = 'stock_adjustments';
    protected $primaryKey = 'adjustment_id';

    protected $fillable = [
        'opname_id',
        'product_id',
        'warehouse_id',
        'qty_before',
        'qty_after',
        'adjusted_by',
        'adjustment_date',
        'reason',
    ];

    protected $casts = [
        'qty_before' => 'integer',
        'qty_after' => 'integer',
        'adjustment_date' => 'datetime',
    ];

    /**
     * Get parent stock opname session.
     */
    public function stockOpname(): BelongsTo
    {
        return $this->belongsTo(StockOpname::class, 'opname_id', 'opname_id');
    }

    /**
     * Get product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    /**
     * Get warehouse.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }

    /**
     * Get user who executed adjustment (Master).
     */
    public function adjuster(): BelongsTo
    {
        return $this->belongsTo(User::class, 'adjusted_by', 'id');
    }
}
