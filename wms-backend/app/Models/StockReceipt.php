<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockReceipt extends Model
{
    use HasFactory;

    protected $fillable = [
        'division_id',
        'grn_number',
        'supplier_name',
        'invoice_number',
        'received_date',
        'notes',

        // Financial fields
        'subtotal',
        'vat_percentage',
        'vat_amount',
        'total_with_vat',

        'status',
        'created_by',
        'confirmed_by',
        'confirmed_at',
        'cancelled_by',
        'cancelled_at',
        'cancellation_reason',
    ];

    protected function casts(): array
    {
        return [
            'received_date' => 'date',
            'confirmed_at' => 'datetime',
            'cancelled_at' => 'datetime',

            'subtotal' => 'decimal:2',
            'vat_percentage' => 'decimal:2',
            'vat_amount' => 'decimal:2',
            'total_with_vat' => 'decimal:2',
        ];
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockReceiptItem::class);
    }

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function confirmer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'confirmed_by');
    }

    public function canceller(): BelongsTo
    {
        return $this->belongsTo(User::class, 'cancelled_by');
    }

    public function movements(): HasMany
    {
        return $this->hasMany(
            StockMovement::class,
            'reference_id',
        )->where('reference_type', 'STOCK_RECEIPT');
    }

    public function isDraft(): bool
    {
        return $this->status === 'DRAFT';
    }

    public function isConfirmed(): bool
    {
        return $this->status === 'CONFIRMED';
    }

    public function isCancelled(): bool
    {
        return $this->status === 'CANCELLED';
    }
}

