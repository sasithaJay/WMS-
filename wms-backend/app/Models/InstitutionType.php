<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class InstitutionType extends Model
{
    protected $fillable = [
        'name_en',
        'name_si',
        'code',
        'is_active',
    ];

    public function organizations(): HasMany
    {
        return $this->hasMany(Organization::class);
    }
}