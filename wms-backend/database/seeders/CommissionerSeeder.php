<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\User;

class CommissionerSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $commissionerRole = Role::where(
            'code',
            'COMMISSIONER'
        )->firstOrFail();

        User::updateOrCreate(
            [
                'username' => 'commissioner',
            ],
            [
                'email' => 'commissioner@wms.gov.lk',
                'password' => 'ChangeMe123!',
                'account_type' => 'STAFF',
                'account_status' => 'ACTIVE',
                'email_verified_at' => now(),
                'approved_at' => now(),
            ]
        );
    }
}
