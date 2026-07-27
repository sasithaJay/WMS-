<?php

// app/Models/StockRequestItem.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockRequestItem extends Model
{
    protected $fillable = [
        'stock_request_id',
        'item_id',
        'quantity_requested',
        'quantity_recommended',
        'quantity_approved',
        'quantity_issued',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity_requested' => 'decimal:3',
            'quantity_recommended' => 'decimal:3',
            'quantity_approved' => 'decimal:3',
            'quantity_issued' => 'decimal:3',
        ];
    }

    public function stockRequest(): BelongsTo
    {
        return $this->belongsTo(StockRequest::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }
}
