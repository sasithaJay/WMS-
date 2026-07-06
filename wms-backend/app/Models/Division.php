<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Division extends Model
{
    protected $fillable = [
        'name_en',
        'name_si',
        'code',
        'is_active'
    ];

    public function stores(): HasMany
    {
        return $this->hasMany(Store::class);
    }
}
