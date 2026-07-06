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
                'email' => 'commissioner@wms.gov.lk',
            ],
            [
                'role_id' => $commissionerRole->id,
                'division_id' => null,
                'section_id' => null,
                'employee_number' => 'COM-001',
                'nic_number' => 'COMMISSIONER-001',
                'name' => 'Commissioner',
                'username' => 'commissioner',
                'phone' => null,
                'password' => 'ChangeMe123!',
                'account_status' => 'ACTIVE',
                'email_verified_at' => now(),
            ]
        );
    }
}
