<?php

namespace Database\Seeders;

use App\Models\Institution;
use Illuminate\Database\Seeder;
use App\Models\Division;

class InstitutionSeeder extends Seeder
{
    public function run(): void
    {

         $socialServiceDivision = Division::where('code', 'SOCIAL_SERVICES')
            ->firstOrFail();

        $childDivision = Division::where('code', 'CHILD_SERVICES')
            ->firstOrFail();

        $institutions = [

            //Social Services - 2 Institutions
            [
                'division_id' => $socialServiceDivision->id,
                'name_en' => 'Place officer, Suraliya Sevena Care Center',
                'name_si' => 'ස්ථාන භාර නිළධාරී, සුරලිය සෙවන රැකවරණ මධ්‍යස්ථානය',
                'code' => 'SURALIYA_SEVENA_CARE_CENTER',
                'district' => 'Galle',
            ],
            [
                'division_id' => $socialServiceDivision->id,
                'name_en' => 'Place officer, Sadeharana Elderly Home',
                'name_si' => 'ස්ථාන භාර නිළධාරී, සැදෑඅරණ වැඩිහිටි නිවාසය',
                'code' => 'SADEHARANA_ELDERLY_HOME',
                'district' => 'Galle',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Matron, Ruhuna Children\'s Home',
                'name_si' => 'මේට්‍රන්, රුහුණු ළමා නිවාසය',
                'code' => "RUHUNA_CHILDREN'S_HOME",
                'district' => 'Matara',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Principal, Viharama Devi Certified School',
                'name_si' => 'පාසල්පති, විහාරමහාදේවී සහතික කළ පාසල',
                'code' => "VIHARAMA_DEVI_CERTIFIED_SCHOOL",
                'district' => 'Matara',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Warden, government children\'s detention home',
                'name_si' => 'වෝර්ඩන්, රජයේ ළමා රැඳවුම් නිවාසය',
                'code' => "GOVERNMENT_CHILDREN'S_DETENTION_HOME",
                'district' => 'Matara',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Principal, Certified School (Hikkaduwa)',
                'name_si' => 'පාසල්පති, සහතික කළ පාසල හික්කඩුව',
                'code' => "CERTIFIED_SCHOOL_HIKKADUWA",
                'district' => 'Galle',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Officer, the government rest house (Halpatota)',
                'name_si' => 'අධිකාරි, රජයේ නිවර්තන නිවාසය හල්පාතොට',
                'code' => "GOVERNMENT_REST_HOUSE_HALPATOTA",
                'district' => 'Galle',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Kanchadeva Children\'s Home',
                'name_si' => 'ස්ථාන භාර නිළධාරී, ඛංචදේව ළමා නිකේතනය',
                'code' => "KANCHADEVA_CHILDREN'S_HOME",
                'district' => 'Galle',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Alpitiya)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය ඇල්පිටිය',
                'code' => "PROBATION_HOME_ALPITIYA",
                'district' => 'Galle',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Balapitiya)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය බලපිටිය',
                'code' => "PROBATION_HOME_BALAPITIYA",
                'district' => 'Galle',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Udugama)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය උඩුගම',
                'code' => "PROBATION_HOME_UDUGAMA",
                'district' => 'Galle',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Galle)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය ගාල්ල',
                'code' => "PROBATION_HOME_GALLE",
                'district' => 'Galle',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Matara)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය මාතර',
                'code' => "PROBATION_HOME_MATARA",
                'district' => 'Matara',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Morawaka)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය මොරවක',
                'code' => "PROBATION_HOME_MORAWAKA",
                'district' => 'Matara',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Thangalla)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය තංගල්ල',
                'code' => "PROBATION_HOME_THANGALLA",
                'district' => 'Matara',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Walasmulla)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය වලස්මුල්ල',
                'code' => "PROBATION_HOME_WALASMULLA",
                'district' => 'Hambantota',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Tissamaharamaya)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය තිස්සමහාරාමය',
                'code' => "PROBATION_HOME_TISSAMAHARAMAYA",
                'district' => 'Hambantota',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Hambantota)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය හම්බන්තොට',
                'code' => "PROBATION_HOME_HAMBANTOTA",
                'district' => 'Hambantota',
            ],
            [
                'division_id' => $childDivision->id,
                'name_en' => 'Place officer, Probation Home (Baddegama)',
                'name_si' => 'ස්ථාන භාර නිළධාරී, පරිවාස කාර්‍යාලය බද්දේගම',
                'code' => "PROBATION_HOME_BADDEGAMA",
                'district' => 'Galle',
            ],
            
        ];

        foreach ($institutions as $institution) {
            Institution::updateOrCreate(
                [
                    'code' => $institution['code'],
                ],
                [
                    'division_id' => $institution['division_id'],
                    'name_en' => $institution['name_en'],
                    'name_si' => $institution['name_si'],
                    'district' => $institution['district'],
                    'is_active' => true,
                ]
            );
        }
    }
}