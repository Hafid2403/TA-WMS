<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Department extends Model
{
    protected $table = 'departments';
    protected $primaryKey = 'department_id';

    protected $fillable = [
        'department_name',
        'head_name',
        'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];
}
