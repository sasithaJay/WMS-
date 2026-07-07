<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Store extends Model
{
    protected $fillable = [
        'name_en',
        'name_si',
        'code',
        'is_active',
        'division_id'
    ];

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }
}
