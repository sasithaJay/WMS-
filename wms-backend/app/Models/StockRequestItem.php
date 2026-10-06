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
        'approval_status',
        'approval_remarks',
        'rejection_reason',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
    ];

    protected function casts(): array
    {
        return [
            'quantity_requested' => 'decimal:3',
            'quantity_recommended' => 'decimal:3',
            'quantity_approved' => 'decimal:3',
            'quantity_issued' => 'decimal:3',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
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

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }
}
