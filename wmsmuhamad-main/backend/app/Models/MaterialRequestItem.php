<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MaterialRequestItem extends Model
{
    protected $table = 'material_request_items';
    protected $primaryKey = 'mr_item_id';

    protected $fillable = [
        'mr_id',
        'product_id',
        'qty_requested',
        'qty_fulfilled',
        'notes',
    ];

    protected $casts = [
        'qty_requested' => 'integer',
        'qty_fulfilled' => 'integer',
    ];

    /**
     * Get parent material request.
     */
    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class, 'mr_id', 'mr_id');
    }

    /**
     * Get product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
