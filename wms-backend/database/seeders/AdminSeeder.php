<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class AdminSeeder extends Seeder
{
    public function run(): void
    {
        $adminRole = Role::where(
            'code',
            'ADMIN'
        )->firstOrFail();

        $salaryNumber = 'admin';
        $username = 'SWPCD-' . $salaryNumber;

        $user = User::updateOrCreate(
            [
                'username' => $username,
            ],
            [
                'email' => 'admin@wms.gov.lk',

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
                'role_id' => $adminRole->id,

                'full_name' => 'Administrator',

                'nic_number' => 'ADMIN-001',

                'phone' => '0000000000',

                'employee_number' => 'ADMIN-001',

                'salary_number' => $salaryNumber,
            ]
        );
    }
}