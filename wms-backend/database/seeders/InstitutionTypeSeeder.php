<?php

namespace Database\Seeders;

use App\Models\Division;
use App\Models\InstitutionType;
use App\Models\Role;
use App\Models\Section;
use App\Models\Store;
use Illuminate\Database\Seeder;

class InstitutionTypeSeeder extends Seeder
{
    public function run(): void
    {
        InstitutionType::create([
            'name_en' => "Children's Home",
            'name_si' => 'ළමා නිවාසය',
            'code' => 'CHILDRENS_HOME',
        ]);

        InstitutionType::create([
            'name_en' => 'Certified School',
            'name_si' => 'සහතික පාසල',
            'code' => 'CERTIFIED_SCHOOL',
        ]);

        InstitutionType::create([
            'name_en' => 'Probation Office',
            'name_si' => 'පරිවාස කාර්යාලය',
            'code' => 'PROBATION_OFFICE',
        ]);

        InstitutionType::create([
            'name_en' => 'Adults Home',
            'name_si' => 'වැඩිහිටි නිවාසය',
            'code' => 'ADULTS_HOME',
        ]);

        InstitutionType::create([
            'name_en' => 'Child Detention Home',
            'name_si' => 'ළමා රැඳවුම් නිවාසය',
            'code' => 'CHILD_DETENTION_HOME',
        ]);

    }
}