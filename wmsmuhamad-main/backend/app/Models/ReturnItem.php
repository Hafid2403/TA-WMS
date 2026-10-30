<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ReturnItem extends Model
{
    protected $table = 'return_items';
    protected $primaryKey = 'return_id';

    protected $fillable = [
        'gr_item_id',
        'product_id',
        'vendor_id',
        'qty_returned',
        'reason',
        'return_date',
        'returned_by',
        'status',
    ];

    protected $casts = [
        'qty_returned' => 'integer',
        'return_date' => 'date',
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
     * Get vendor.
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id', 'vendor_id');
    }

    /**
     * Get user who executed return.
     */
    public function returner(): BelongsTo
    {
        return $this->belongsTo(User::class, 'returned_by', 'id');
    }
}
