<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ActivityLog extends Model
{
    protected $table = 'activity_logs';
    protected $primaryKey = 'log_id';
    public $timestamps = false; // Custom created_at only

    protected $appends = ['activity_type'];

    /**
     * Virtual attribute mapping 'action' to 'activity_type' for frontend compatibility.
     */
    public function getActivityTypeAttribute()
    {
        return $this->action;
    }

    protected $fillable = [
        'user_id',
        'action',
        'description',
        'ip_address',
        'user_agent',
    ];

    /**
     * Get user who performed action.
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id', 'id');
    }
}
