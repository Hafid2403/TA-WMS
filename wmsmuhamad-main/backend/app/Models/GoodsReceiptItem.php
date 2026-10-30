<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoodsReceiptItem extends Model
{
    protected $table = 'goods_receipt_items';
    protected $primaryKey = 'gr_item_id';

    protected $fillable = [
        'gr_id',
        'vendor_product_id',
        'product_id',
        'qty_received',
        'qty_accepted',
        'qty_rejected',
        'qc_status',
        'qc_checklist',
        'qc_photo',
        'qc_by',
        'qc_date',
        'qc_notes',
    ];

    protected $casts = [
        'qty_received' => 'integer',
        'qty_accepted' => 'integer',
        'qty_rejected' => 'integer',
        'qc_checklist' => 'array',
        'qc_date' => 'datetime',
    ];

    /**
     * Get parent goods receipt.
     */
    public function goodsReceipt(): BelongsTo
    {
        return $this->belongsTo(GoodsReceipt::class, 'gr_id', 'gr_id');
    }

    /**
     * Get vendor product catalog mapping.
     */
    public function vendorProduct(): BelongsTo
    {
        return $this->belongsTo(VendorProduct::class, 'vendor_product_id', 'vendor_product_id');
    }

    /**
     * Get product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }

    /**
     * Get QC inspector user.
     */
    public function qcInspector(): BelongsTo
    {
        return $this->belongsTo(User::class, 'qc_by', 'id');
    }

    /**
     * Get returned item record if rejected.
     */
    public function returnRecord(): HasOne
    {
        return $this->hasOne(ReturnItem::class, 'gr_item_id', 'gr_item_id');
    }

    /**
     * Get putaway records.
     */
    public function putaways(): HasMany
    {
        return $this->hasMany(Putaway::class, 'gr_item_id', 'gr_item_id');
    }
}
