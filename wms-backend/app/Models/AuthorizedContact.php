<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuthorizedContact extends Model
{
    protected $fillable = [
        'organization_id',
        'full_name',
        'designation',
        'nic_number',
        'phone',
        'email',
        'is_primary',
    ];

    public function organization(): BelongsTo
    {
        return $this->belongsTo(Organization::class);
    }
}