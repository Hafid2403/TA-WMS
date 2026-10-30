<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Putaway extends Model
{
    protected $table = 'putaways';
    protected $primaryKey = 'putaway_id';

    protected $fillable = [
        'gr_item_id',
        'product_id',
        'warehouse_id',
        'qty_placed',
        'zone',
        'rack',
        'bin',
        'placed_by',
        'placed_date',
        'status',
    ];

    protected $casts = [
        'qty_placed' => 'integer',
        'placed_date' => 'datetime',
    ];

    /**
     * Get parent goods receipt item.
     */
    public function goodsReceiptItem(): BelongsTo
    {
        return $this->belongsTo(GoodsReceiptItem::class, 'gr_item_id', 'gr_item_id');
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
     * Get operator user who placed stock.
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'placed_by', 'id');
    }
}
