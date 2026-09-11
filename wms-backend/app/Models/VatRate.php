<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VatRate extends Model
{
    protected $fillable = [
        'percentage',
        'status',
        'requested_by',
        'reviewed_by',
        'reviewed_at',
        'review_comment',
    ];

    protected function casts(): array
    {
        return [
            'percentage' => 'decimal:2',
            'reviewed_at' => 'datetime',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requested_by');
    }

    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * The currently active VAT percentage — the most recently approved rate.
     * Returns 0 if no rate has ever been approved.
     */
    public static function currentPercentage(): float
    {
        $latest = self::where('status', 'APPROVED')
            ->latest('reviewed_at')
            ->first();

        return $latest ? (float) $latest->percentage : 0.0;
    }
}