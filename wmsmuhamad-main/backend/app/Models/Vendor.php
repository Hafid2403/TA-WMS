<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Vendor extends Model
{
    protected $table = 'vendors';
    protected $primaryKey = 'vendor_id';

    protected $fillable = [
        'vendor_name',
        'contact_person',
        'phone',
        'email',
        'address',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    /**
     * Get vendor products supplied by this vendor.
     */
    public function vendorProducts(): HasMany
    {
        return $this->hasMany(VendorProduct::class, 'vendor_id', 'vendor_id');
    }
}
