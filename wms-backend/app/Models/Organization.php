<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Organization extends Model
{
    protected $fillable = [
        'user_id',
        'division_id',
        'organization_kind',
        'name',
        'institution_type_id',
        'address',
        'contact_number',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function division(): BelongsTo
    {
        return $this->belongsTo(Division::class);
    }

    public function institutionType(): BelongsTo
    {
        return $this->belongsTo(InstitutionType::class);
    }

    public function authorizedContacts(): HasMany
    {
        return $this->hasMany(AuthorizedContact::class);
    }
}