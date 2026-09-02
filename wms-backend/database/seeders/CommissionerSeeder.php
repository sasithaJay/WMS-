<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class CommissionerSeeder extends Seeder
{
    public function run(): void
    {
        $commissionerRole = Role::where(
            'code',
            'COMMISSIONER'
        )->firstOrFail();

        // Commissioner is a permanent system account
        $salaryNumber = 'comm';
        $username = 'SWPCS-' . $salaryNumber;

        $user = User::updateOrCreate(
            [
                'username' => $username,
            ],
            [
                'email' => 'commissioner@wms.gov.lk',

                'password' => Hash::make('12345678'),

                'account_type' => 'STAFF',
                'account_status' => 'ACTIVE',

                'approved_by' => null,
                'approved_at' => now(),
                'rejection_reason' => null,
            ]
        );

        StaffProfile::updateOrCreate(
            [
                'user_id' => $user->id,
            ],
            [
                'division_id' => null,
                'section_id' => null,
                'role_id' => $commissionerRole->id,

                'full_name' => 'Commissioner of Social Services',

                'nic_number' => 'COMMISSIONER-001',

                'phone' => '0000000000',

                'employee_number' => 'COMMISSIONER-001',

                'salary_number' => $salaryNumber,
            ]
        );
    }
}