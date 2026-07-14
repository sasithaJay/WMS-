<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockReceiptItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'stock_receipt_id',
        'item_id',
        'quantity_received',
        'unit_cost',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity_received' => 'decimal:3',
            'unit_cost' => 'decimal:2',
        ];
    }

    public function stockReceipt(): BelongsTo
    {
        return $this->belongsTo(StockReceipt::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function getLineTotalAttribute(): ?string
    {
        if ($this->unit_cost === null) {
            return null;
        }

        return number_format(
            (float) $this->quantity_received
            * (float) $this->unit_cost,
            2,
            '.',
            '',
        );
    }
}