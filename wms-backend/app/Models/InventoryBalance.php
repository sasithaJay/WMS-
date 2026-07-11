<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class InventoryBalance extends Model
{
    protected $fillable = [
        'item_id',
        'quantity_on_hand',
        'reserved_quantity',
    ];

    protected function casts(): array
    {
        return [
            'quantity_on_hand' => 'integer',
            'reserved_quantity' => 'integer',
        ];
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}