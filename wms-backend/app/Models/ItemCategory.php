<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ItemCategory extends Model
{
    protected $fillable = [
        'name_en',
        'name_si',
        'code',
        'is_returnable',
        'is_active',
    ];

    protected function casts(): array
    {
        return [
            'is_active' => 'boolean',
            'is_returnable' => 'boolean',
        ];
    }

    public function items(): HasMany
    {
        return $this->hasMany(Item::class, 'category_id');
    }
}
