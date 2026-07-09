<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use App\Models\Division;
use App\Models\Role;
use App\Models\Store;
use App\Models\Section;
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

        Section::create([
            'division_id' => $socialDivision->id,
            'name_en' => 'Accounts',
            'name_si' => 'ගිණුම්',
            'code' => 'SOCIAL_ACCOUNTS',
        ]);

        Section::create([
            'division_id' => $socialDivision->id,
            'name_en' => 'Development',
            'name_si' => 'සංවර්ධන',
            'code' => 'SOCIAL_DEVELOPMENT',
        ]);

        Section::create([
            'division_id' => $socialDivision->id,
            'name_en' => 'Institute',
            'name_si' => 'ආයතන',
            'code' => 'SOCIAL_INSTITUTE',
        ]);

        Section::create([
            'division_id' => $childDivision->id,
            'name_en' => 'Development',
            'name_si' => 'සංවර්ධන',
            'code' => 'CHILD_DEVELOPMENT',
        ]);

        Section::create([
            'division_id' => $childDivision->id,
            'name_en' => 'Institute',
            'name_si' => 'ආයතන',
            'code' => 'CHILD_INSTITUTE',
        ]);

        Section::create([
            'division_id' => $childDivision->id,
            'name_en' => 'Probation',
            'name_si' => 'පරිවාස',
            'code' => 'CHILD_PROBATION',
        ]);

    }
}
