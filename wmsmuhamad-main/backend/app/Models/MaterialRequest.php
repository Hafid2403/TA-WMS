<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MaterialRequest extends Model
{
    protected $table = 'material_requests';
    protected $primaryKey = 'mr_id';

    protected $fillable = [
        'mr_number',
        'warehouse_id',
        'department_id',
        'requested_by',
        'request_date',
        'status',
        'approved_by',
        'approved_date',
        'notes',
    ];

    protected $casts = [
        'request_date' => 'datetime',
        'approved_date' => 'datetime',
    ];

    /**
     * Get warehouse.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }

    /**
     * Get department requesting materials.
     */
    public function department(): BelongsTo
    {
        return $this->belongsTo(Department::class, 'department_id', 'department_id');
    }

    /**
     * Get user who approved request (Master).
     */
    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by', 'id');
    }

    /**
     * Get items in material request.
     */
    public function items(): HasMany
    {
        return $this->hasMany(MaterialRequestItem::class, 'mr_id', 'mr_id');
    }
}
