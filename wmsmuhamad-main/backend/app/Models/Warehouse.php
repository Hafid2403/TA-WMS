<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Warehouse extends Model
{
    protected $table = 'warehouses';
    protected $primaryKey = 'warehouse_id';

    protected $fillable = [
        'warehouse_name',
        'address',
        'city',
        'pic_id',
        'is_active',
        'capacity',
        'status',
    ];

    /**
     * Get PIC for this warehouse.
     */
    public function pic(): BelongsTo
    {
        return $this->belongsTo(User::class, 'pic_id', 'id');
    }

    /**
     * Get stock records in this warehouse.
     */
    public function stocks(): HasMany
    {
        return $this->hasMany(Stock::class, 'warehouse_id', 'warehouse_id');
    }

    /**
     * Get signature configurations for this warehouse.
     */
    public function signatures(): HasMany
    {
        return $this->hasMany(WarehouseSignature::class, 'warehouse_id', 'warehouse_id');
    }
}
