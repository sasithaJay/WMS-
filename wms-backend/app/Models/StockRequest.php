<?php

// app/Models/StockRequest.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class StockRequest extends Model
{
    protected $fillable = [
        'request_number',
        'requester_id',
        'division_id',
        'store_id',
        'section_id',
        'organization_id',
        'request_context',
        'status',
        'current_stage',
        'recommender_id',
        'approver_id',
        'ds_office_id',
        'notes',
        'submitted_at',
    ];

    protected function casts(): array
    {
        return [
            'submitted_at' => 'datetime',
        ];
    }

    public function requester(): BelongsTo
    {
        return $this->belongsTo(User::class, 'requester_id');
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function store(): BelongsTo
    {
        return $this->belongsTo(Store::class);
    }

    public function section(): BelongsTo
    {
        return $this->belongsTo(Section::class);
    }

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }

    public function dsOffice(): BelongsTo
    {
        return $this->belongsTo(DsOffice::class);
    }

    public function recommender(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recommender_id');
    }

    public function approver(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approver_id');
    }

    public function items(): HasMany
    {
        return $this->hasMany(StockRequestItem::class);
    }

    public function actions(): HasMany
    {
        return $this->hasMany(StockRequestAction::class);
    }
}
