<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockOpnameItem extends Model
{
    protected $table = 'stock_opname_items';
    protected $primaryKey = 'opname_item_id';

    protected $fillable = [
        'opname_id',
        'product_id',
        'system_qty',
        'physical_qty',
        'discrepancy',
        'notes',
    ];

    protected $casts = [
        'system_qty' => 'integer',
        'physical_qty' => 'integer',
        'discrepancy' => 'integer',
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
}
