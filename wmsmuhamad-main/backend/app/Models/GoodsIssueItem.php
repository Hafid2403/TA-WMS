<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class GoodsIssueItem extends Model
{
    protected $table = 'goods_issue_items';
    protected $primaryKey = 'gi_item_id';

    protected $fillable = [
        'gi_id',
        'product_id',
        'qty_issued',
    ];

    protected $casts = [
        'qty_issued' => 'integer',
    ];

    /**
     * Get parent goods issue.
     */
    public function goodsIssue(): BelongsTo
    {
        return $this->belongsTo(GoodsIssue::class, 'gi_id', 'gi_id');
    }

    /**
     * Get product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
