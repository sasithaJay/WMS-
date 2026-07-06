<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Division;
use App\Models\Role;
use App\Models\Store;
use Illuminate\Database\Seeder;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        $socialDivision = Division::create([
            'name_en' => 'Social Services Division',
            'name_si' => 'සමාජ සේවා අංශය',
            'code' => 'SOCIAL_SERVICES',
        ]);

        $childDivision = Division::create([
            'name_en' => 'Child Services Division',
            'name_si' => 'ළමා සේවා අංශය',
            'code' => 'CHILD_SERVICES',
        ]);

        Store::create([
            'division_id' => $socialDivision->id,
            'name_en' => 'Social Services Store',
            'name_si' => 'සමාජ සේවා ගබඩාව',
            'code' => 'SOCIAL_STORE',
        ]);

        Store::create([
            'division_id' => $childDivision->id,
            'name_en' => 'Child Services Store',
            'name_si' => 'ළමා සේවා ගබඩාව',
            'code' => 'CHILD_STORE',
        ]);

        $roles = [
            [
                'name' => 'Commissioner',
                'code' => 'COMMISSIONER',
                'level' => 100,
            ],
            [
                'name' => 'Assistant Commissioner',
                'code' => 'ASSISTANT_COMMISSIONER',
                'level' => 90,
            ],
            [
                'name' => 'Assistant Director',
                'code' => 'ASSISTANT_DIRECTOR',
                'level' => 90,
            ],
            [
                'name' => 'Administrative Officer',
                'code' => 'ADMINISTRATIVE_OFFICER',
                'level' => 80,
            ],
            [
                'name' => 'Accountant',
                'code' => 'ACCOUNTANT',
                'level' => 80,
            ],
            [
                'name' => 'Section Head',
                'code' => 'SECTION_HEAD',
                'level' => 70,
            ],
            [
                'name' => 'Development Officer',
                'code' => 'DEVELOPMENT_OFFICER',
                'level' => 50,
            ],
            [
                'name' => 'Other Officer',
                'code' => 'OTHER_OFFICER',
                'level' => 40,
            ],
            [
                'name' => 'Store Keeper',
                'code' => 'STORE_KEEPER',
                'level' => 30,
            ],
            [
                'name' => 'Admin',
                'code' => 'ADMIN',
                'level' => 100,
            ],
        ];

        foreach ($roles as $role) {
            Role::create($role);
        }
    }
}
