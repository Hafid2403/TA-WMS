<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'role_id',
        'warehouse_id',
        'is_active',
        'status',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'is_active' => 'boolean',
        ];
    }

    /**
     * Get user role.
     */
    public function role(): BelongsTo
    {
        return $this->belongsTo(Role::class, 'role_id', 'role_id');
    }

    /**
     * Get warehouse assigned to this user.
     */
    public function warehouse(): BelongsTo
    {
        return $this->belongsTo(Warehouse::class, 'warehouse_id', 'warehouse_id');
    }

    /**
     * Check if user is a Master.
     */
    public function isMaster(): bool
    {
        return $this->role && $this->role->role_name === 'Master';
    }

    /**
     * Check if user is a PIC.
     */
    public function isPIC(): bool
    {
        return $this->role && $this->role->role_name === 'PIC';
    }

    /**
     * Check if user is QC.
     */
    public function isQC(): bool
    {
        return $this->role && $this->role->role_name === 'QC';
    }

    /**
     * Check if user is a Super Admin.
     */
    public function isSuperadmin(): bool
    {
        return $this->role && $this->role->role_name === 'Super Admin';
    }
}
