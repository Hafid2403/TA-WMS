<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Stock extends Model
{
    protected $table = 'stock';
    protected $primaryKey = 'stock_id';

    protected $fillable = [
        'warehouse_id',
        'product_id',
        'qty_available',
        'qty_reserved',
        'zone',
        'rack',
        'bin',
    ];

    protected $casts = [
        'qty_available' => 'integer',
        'qty_reserved' => 'integer',
    ];

    /**
     * Get warehouse.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }

    /**
     * Get product.
     */
    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'product_id', 'product_id');
    }
}
