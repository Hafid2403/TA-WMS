<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Product extends Model
{
    protected $table = 'products';
    protected $primaryKey = 'product_id';

    protected $fillable = [
        'category_id',
        'internal_code',
        'product_name',
        'unit',
        'description',
        'min_stock',
        'is_active',
    ];

    protected $casts = [
        'min_stock' => 'integer',
        'is_active' => 'boolean',
    ];

    /**
     * Get the category of the product.
     */
    public function category(): BelongsTo
    {
        return $this->belongsTo(ProductCategory::class, 'category_id', 'category_id');
    }

    /**
     * Get vendor products mapped to this product.
     */
    public function vendorProducts(): HasMany
    {
        return $this->hasMany(VendorProduct::class, 'product_id', 'product_id');
    }

    /**
     * Get stock levels of this product across all warehouses.
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class, 'product_id', 'product_id');
    }
}
