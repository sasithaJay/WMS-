<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EquipmentAssignment extends Model
{
    protected $appends = ['assigned_to_user'];

    protected $fillable = [
        'item_id', 'stock_request_item_id', 'assigned_to', 'issued_by', 'issued_at',
        'status', 'return_reason', 'return_requested_at', 'returned_by', 'returned_at',
        'return_condition', 'return_remarks',
    ];

    protected function casts(): array
    {
        return [
            'issued_at' => 'datetime',
            'return_requested_at' => 'datetime',
            'returned_at' => 'datetime',
        ];
    }

    public function item(): BelongsTo { return $this->belongsTo(Item::class); }
    public function assignedTo(): BelongsTo { return $this->belongsTo(User::class, 'assigned_to'); }
    public function issuedBy(): BelongsTo { return $this->belongsTo(User::class, 'issued_by'); }
    public function returnedBy(): BelongsTo { return $this->belongsTo(User::class, 'returned_by'); }
    public function stockRequestItem(): BelongsTo { return $this->belongsTo(StockRequestItem::class); }

    public function getAssignedToUserAttribute(): ?User
    {
        return $this->assignedTo;
    }
}