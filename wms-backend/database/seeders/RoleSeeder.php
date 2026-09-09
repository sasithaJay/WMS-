<?php

namespace Database\Seeders;

use App\Models\Role;
use Illuminate\Database\Seeder;

class RoleSeeder extends Seeder
{
    public function run(): void
    {
        $roles = [
            [
                'code' => 'COMMISSIONER',
                'name_en' => 'Commissioner',
                'name_si' => 'කොමසාරිස්',
            ],
            [
                'code' => 'ASSISTANT_COMMISSIONER',
                'name_en' => 'Assistant Commissioner',
                'name_si' => 'සහකාර කොමසාරිස්',
            ],
            [
                'code' => 'ASSISTANT_DIRECTOR',
                'name_en' => 'Assistant Director',
                'name_si' => 'සහකාර අධ්‍යක්ෂ',
            ],
            [
                'code' => 'ADMINISTRATIVE_OFFICER',
                'name_en' => 'Administrative Officer',
                'name_si' => 'පරිපාලන නිලධාරී',
            ],
            [
                'code' => 'ACCOUNTANT',
                'name_en' => 'Accountant',
                'name_si' => 'ගණකාධිකාරී',
            ],
            [
                'code' => 'SECTION_HEAD',
                'name_en' => 'Section Head',
                'name_si' => 'අංශ ප්‍රධානී',
            ],
            [
                'code' => 'STORE_KEEPER',
                'name_en' => 'Store Keeper',
                'name_si' => 'ගබඩා භාරකරු',
            ],
            [
                'code' => 'DEVELOPMENT_OFFICER',
                'name_en' => 'Development Officer',
                'name_si' => 'සංවර්ධන නිලධාරී',
            ],
            [
                'code' => 'OTHER_OFFICER',
                'name_en' => 'Other Officer',
                'name_si' => 'වෙනත් නිලධාරී',
            ],
            [
                'code' => 'ADMIN',
                'name_en' => 'Admin',
                'name_si' => 'පද්ධති පරිපාලක',
            ],
            ['name_en' => 'Management Service Officer', 'name_si' => 'කළමනාකරණ සේවා නිලධාරී', 'code' => 'MSO'],
            ['name_en' => 'Office Assistant', 'name_si' => 'කාර්යාල සහායක', 'code' => 'OA'],
            ['name_en' => 'Driver', 'name_si' => 'රියදුරු', 'code' => 'DRIVER'],
            ['name_en' => 'Senior Social Service Officer', 'name_si' => 'ජ්‍යෙෂ්ඨ සමාජ සේවා නිලධාරී', 'code' => 'SSO'],
            ['name_en' => 'Head Quarters SSO', 'name_si' => 'මූලස්ථාන SSO', 'code' => 'HQSSO'],
            ['name_en' => 'Senior Probation Officer', 'name_si' => 'ජ්‍යෙෂ්ඨ පරිවාස නිලධාරී', 'code' => 'SPO'],
        ];

        foreach ($roles as $role) {
            Role::updateOrCreate(
                [
                    'code' => $role['code'],
                ],
                [
                    'name_en' => $role['name_en'],
                    'name_si' => $role['name_si'],
                    'is_active' => true,
                ]
            );
        }
    }
}