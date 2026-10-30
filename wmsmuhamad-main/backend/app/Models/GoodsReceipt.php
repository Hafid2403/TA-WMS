<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoodsReceipt extends Model
{
    protected $table = 'goods_receipts';
    protected $primaryKey = 'gr_id';

    protected $fillable = [
        'gr_number',
        'po_id',
        'warehouse_id',
        'vendor_id',
        'received_by',
        'receipt_date',
        'receipt_type',
        'notes',
    ];

    protected $casts = [
        'receipt_date' => 'datetime',
    ];

    /**
     * Get purchase order.
     */
    public function purchaseOrder(): BelongsTo
    {
        return $this->belongsTo(PurchaseOrder::class, 'po_id', 'po_id');
    }

    /**
     * Get warehouse.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }

    /**
     * Get vendor.
     */
    public function vendor(): BelongsTo
    {
        return $this->belongsTo(Vendor::class, 'vendor_id', 'vendor_id');
    }

    /**
     * Get user who received goods.
     */
    public function receiver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'received_by', 'id');
    }

    /**
     * Get items in receipt.
     */
    public function items(): HasMany
    {
        return $this->hasMany(GoodsReceiptItem::class, 'gr_id', 'gr_id');
    }
}
