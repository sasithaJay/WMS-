<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class StockMovement extends Model
{
    use HasFactory;

    protected $fillable = [
        'division_id',
        'item_id',
        'movement_type',
        'quantity',
        'balance_before',
        'balance_after',
        'reference_type',
        'reference_id',
        'reference_number',
        'performed_by',
        'remarks',
    ];

    protected function casts(): array
    {
        return [
            'quantity' => 'decimal:3',
            'balance_before' => 'decimal:3',
            'balance_after' => 'decimal:3',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function item(): BelongsTo
    {
        return $this->belongsTo(Item::class);
    }

    public function performer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'performed_by');
    }

    public function stockReceipt(): BelongsTo
    {
        return $this->belongsTo(
            StockReceipt::class,
            'reference_id',
        );
    }

    public function stockRequest(): BelongsTo
    {
        return $this->belongsTo(StockRequest::class, 'reference_id');
    }

    public function isIncoming(): bool
    {
        return in_array($this->movement_type, [
            'RECEIPT',
            'RETURN',
            'ADJUSTMENT_IN',
        ], true);
    }

    public function isOutgoing(): bool
    {
        return in_array($this->movement_type, [
            'ISSUE',
            'ADJUSTMENT_OUT',
        ], true);
    }
}
