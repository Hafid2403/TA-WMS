<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class GoodsIssue extends Model
{
    protected $table = 'goods_issues';
    protected $primaryKey = 'gi_id';

    protected $fillable = [
        'gi_number',
        'mr_id',
        'warehouse_id',
        'issued_by',
        'issue_date',
        'notes',
    ];

    protected $casts = [
        'issue_date' => 'datetime',
    ];

    /**
     * Get parent material request.
     */
    public function materialRequest(): BelongsTo
    {
        return $this->belongsTo(MaterialRequest::class, 'mr_id', 'mr_id');
    }

    /**
     * Get warehouse.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }

    /**
     * Get operator user who issued stock.
     */
    public function operator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'issued_by', 'id');
    }

    /**
     * Get items in goods issue.
     */
    public function items(): HasMany
    {
        return $this->hasMany(GoodsIssueItem::class, 'gi_id', 'gi_id');
    }
}
