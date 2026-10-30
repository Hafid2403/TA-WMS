<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class WarehouseSignature extends Model
{
    protected $table = 'warehouse_signatures';

    protected $fillable = [
        'warehouse_id',
        'document_type',
        'columns',
    ];

    protected $casts = [
        'columns' => 'array',
    ];

    /**
     * Get warehouse.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }
}
