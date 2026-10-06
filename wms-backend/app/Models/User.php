<?php

namespace App\Models;

use Database\Factories\UserFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Illuminate\Database\Eloquent\Casts\Attribute;

class User extends Authenticatable
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable, Notifiable;

    protected $fillable = [
        'username',
        'email',
        'password',
        'account_type',
        'account_status',
        'approved_by',
        'approved_at',
        'rejection_reason',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'approved_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    protected function name(): Attribute
    {
        return Attribute::make(
            get: fn () => $this->staffProfile?->full_name ?? $this->organization?->name ?? $this->username,
        );
    }

    protected function roleLabel(): Attribute
    {
        return Attribute::make(
            get: fn () =>  $this->staffProfile?->role?->name_en,
        );
    }

    protected $appends = ['name', 'role_label'];

    public function staffProfile(): HasOne
    {
        return $this->hasOne(StaffProfile::class);
    }

    public function organization(): HasOne
    {
        return $this->hasOne(Organization::class);
    }
    public function createdStockReceipts(): HasMany
    {
        return $this->hasMany(
            StockReceipt::class,
            'created_by',
        );
    }

    public function confirmedStockReceipts(): HasMany
    {
        return $this->hasMany(
            StockReceipt::class,
            'confirmed_by',
        );
    }

    public function cancelledStockReceipts(): HasMany
    {
        return $this->hasMany(
            StockReceipt::class,
            'cancelled_by',
        );
    }

    public function performedStockMovements(): HasMany
    {
        return $this->hasMany(
            StockMovement::class,
            'performed_by',
        );
    }
        public function divisionId(): ?int
    {
        return $this->staffProfile?->division_id;
    }

    public function roleCode(): ?string
    {
        return $this->staffProfile?->role?->code;
    }

    public function isStoreKeeper(): bool
    {
        return $this->roleCode() === 'STORE_KEEPER';
    }

    public function equipmentAssignments(): HasMany
    {
        return $this->hasMany(EquipmentAssignment::class, 'assigned_to');
    }
}