<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DsOffice extends Model
{
    protected $fillable = [
        'name_en',
        'name_si',
        'code',
        'district',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
        ];
    }
}