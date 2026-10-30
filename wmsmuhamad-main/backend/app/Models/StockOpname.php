<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockOpname extends Model
{
    protected $table = 'stock_opnames';
    protected $primaryKey = 'opname_id';

    protected $fillable = [
        'warehouse_id',
        'conducted_by',
        'approved_by',
        'start_date',
        'end_date',
        'status',
        'notes',
    ];

    protected $casts = [
        'start_date' => 'datetime',
        'end_date' => 'datetime',
    ];

    /**
     * Get warehouse.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }

    /**
     * Get user who conducted opname (PIC).
     */
    public function conductor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'conducted_by', 'id');
    }

    /**
     * Get user who approved opname (Master).
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'id');
    }

    /**
     * Get counted items in this session.
     */
    public function items(): HasMany
    {
        return $this->hasMany(StockOpnameItem::class, 'opname_id', 'opname_id');
    }
}
