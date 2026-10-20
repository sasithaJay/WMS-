<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PhoneVerification extends Model
{
    protected $fillable = [
        'phone', 'account_type', 'registration_payload', 'otp_hash',
        'verification_token', 'expires_at', 'verified_at', 'token_used_at', 'attempts',
    ];

    protected function casts(): array
    {
        return [
            'expires_at' => 'datetime',
            'verified_at' => 'datetime',
            'token_used_at' => 'datetime',
        ];
    }
}