<?php

namespace Database\Seeders;

use App\Models\DsOffice;
use Illuminate\Database\Seeder;

class DsOfficeSeeder extends Seeder
{
    public function run(): void
    {
        $offices = [

            //galle district - 22 DS Offices
            [
                'name_en' => 'Akmeemana Divisional Secretariat',
                'name_si' => 'අක්මීමන',
                'code' => 'GALLE_AKMEEMANA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Elpitiya Divisional Secretariat',
                'name_si' => 'ඇල්පිටිය',
                'code' => 'GALLE_ELPITIYA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Baddegama Divisional Secretariat',
                'name_si' => 'බද්දේගම',
                'code' => 'GALLE_BADDEGAMA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Balapitiya Divisional Secretariat',
                'name_si' => 'බලපිටිය',
                'code' => 'GALLE_BALAPITIYA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Bentota Divisional Secretariat',
                'name_si' => 'බෙන්තොට',
                'code' => 'GALLE_BENTOTA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Bope-Poddala Divisional Secretariat',
                'name_si' => 'බෝපේ පෝද්දල',
                'code' => 'GALLE_BOPE_PODDALA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Ambalangoda Divisional Secretariat',
                'name_si' => 'අම්බලන්ගොඩ',
                'code' => 'GALLE_AMBALANGODA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Galle Four Gravets Divisional Secretariat',
                'name_si' => 'ගා/කඩවත්සතර',
                'code' => 'GALLE_FOUR_GRAVETS',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Gonapinuwala Divisional Secretariat',
                'name_si' => 'ගෝනපීනුවල',
                'code' => 'GALLE_GONAPINUWALA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Habaraduwa Divisional Secretariat',
                'name_si' => 'හබරාදූව',
                'code' => 'GALLE_HABARADUWA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Hikkaduwa Divisional Secretariat',
                'name_si' => 'හික්කඩුව',
                'code' => 'GALLE_HIKKADUWA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Imaduwa Divisional Secretariat',
                'name_si' => 'ඉමදූව',
                'code' => 'GALLE_IMADUWA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Karandeniya Divisional Secretariat',
                'name_si' => 'කරන්දෙනිය',
                'code' => 'GALLE_KARANDENIYA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Nagoda Divisional Secretariat',
                'name_si' => 'නාගොඩ',
                'code' => 'GALLE_NAGODA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Neluwa Divisional Secretariat',
                'name_si' => 'නෙළුව',
                'code' => 'GALLE_NELUWA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Niyagama Divisional Secretariat',
                'name_si' => 'නියාගම',
                'code' => 'GALLE_NIYAGAMA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Thawalama Divisional Secretariat',
                'name_si' => 'තවලම',
                'code' => 'GALLE_THAWALAMA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Welivitiya-Divithura Divisional Secretariat',
                'name_si' => 'වැලිවිටිය දිවිතුර',
                'code' => 'GALLE_WELIVITIYA_DIVITHURA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Yakkalamulla Divisional Secretariat',
                'name_si' => 'යක්කලමුල්ල',
                'code' => 'GALLE_YAKKALAMULLA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Rathgama Divisional Secretariat',
                'name_si' => 'රත්ගම',
                'code' => 'GALLE_RATHGAMA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Wanduramba Divisional Secretariat',
                'name_si' => 'වඳුරඹ',
                'code' => 'GALLE_WANDURAMBA',
                'district' => 'Galle',
            ],
            [
                'name_en' => 'Madampagama Divisional Secretariat',
                'name_si' => 'මාදම්පාගම',
                'code' => 'GALLE_MADAMPAGAMA',
                'district' => 'Galle',
            ],

            //matara district - 16 DS Offices

            [
                'name_en' => 'Akuressa Divisional Secretariat',
                'name_si' => 'අකුරැස්ස',
                'code' => 'MATARA_AKURESSA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Athuraliya Divisional Secretariat',
                'name_si' => 'අතුරලිය',
                'code' => 'MATARA_ATHURALIYA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Devinuwara Divisional Secretariat',
                'name_si' => 'දෙවිනුවර',
                'code' => 'MATARA_DEVINUWARA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Dickwella Divisional Secretariat',
                'name_si' => 'දික්වැල්ල',
                'code' => 'MATARA_DICKWELLA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Hakmana Divisional Secretariat',
                'name_si' => 'හක්මණ',
                'code' => 'MATARA_HAKMANA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Kamburupitiya Divisional Secretariat',
                'name_si' => 'කඹුරුපිටිය',
                'code' => 'MATARA_KAMBURUPITIYA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Kirinda Puhulwella Divisional Secretariat',
                'name_si' => 'කිරින්ද පුහුල්වැල්ල',
                'code' => 'MATARA_KIRINDA_PUHULWELLA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Kotapola Divisional Secretariat',
                'name_si' => 'කොටපොළ',
                'code' => 'MATARA_KOTAPOLA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Malimbada Divisional Secretariat',
                'name_si' => 'මාලිම්බඩ',
                'code' => 'MATARA_MALIMBADA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Matara Divisional Secretariat',
                'name_si' => 'මාතර',
                'code' => 'MATARA_MATARA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Mulatiyana Divisional Secretariat',
                'name_si' => 'මුලටියන',
                'code' => 'MATARA_MULATIYANA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Pasgoda Divisional Secretariat',
                'name_si' => 'පස්ගොඩ',
                'code' => 'MATARA_PASGODA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Pitabeddara Divisional Secretariat',
                'name_si' => 'පිටබැද්දර',
                'code' => 'MATARA_PITABEDDARA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Thihagoda Divisional Secretariat',
                'name_si' => 'තිහගොඩ',
                'code' => 'MATARA_THIHAGODA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Weligama Divisional Secretariat',
                'name_si' => 'වැලිගම',
                'code' => 'MATARA_WELIGAMA',
                'district' => 'Matara',
            ],
            [
                'name_en' => 'Welipitiya Divisional Secretariat',
                'name_si' => 'වැලිපිටිය',
                'code' => 'MATARA_WELIPITIYA',
                'district' => 'Matara',
            ],

            //hambantota district - 12 DS Offices

            [
                'name_en' => 'Hambantota Divisional Secretariat',
                'name_si' => 'හම්බන්තොට',
                'code' => 'HAMBANTOTA_HAMBANTOTA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Ambalantota Divisional Secretariat',
                'name_si' => 'අම්බලන්තොට',
                'code' => 'HAMBANTOTA_AMBALANTOTA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Angunakolapelessa Divisional Secretariat',
                'name_si' => 'අඟුණුකොලපැලැස්ස',
                'code' => 'HAMBANTOTA_ANGUNAKOLAPELESSA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Beliatta Divisional Secretariat',
                'name_si' => 'බෙලිඅත්ත',
                'code' => 'HAMBANTOTA_BELIATTA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Katuwana Divisional Secretariat',
                'name_si' => 'කටුවන',
                'code' => 'HAMBANTOTA_KATUWANA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Lunugamvehera Divisional Secretariat',
                'name_si' => 'ලුණුගම්වෙහෙර',
                'code' => 'HAMBANTOTA_LUNUGAMVEHERA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Okewela Divisional Secretariat',
                'name_si' => 'ඔකේවෙල',
                'code' => 'HAMBANTOTA_OKEWELA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Sooriyawewa Divisional Secretariat',
                'name_si' => 'සුරියවැව',
                'code' => 'HAMBANTOTA_SOORIYAWEWA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Tangalle Divisional Secretariat',
                'name_si' => 'තංගල්ල',
                'code' => 'HAMBANTOTA_TANGALLE',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Tissamaharama Divisional Secretariat',
                'name_si' => 'තිස්සමහාරාම',
                'code' => 'HAMBANTOTA_TISSAMAHARAMA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Walasmulla Divisional Secretariat',
                'name_si' => 'වලස්මුල්ල',
                'code' => 'HAMBANTOTA_WALASMULLA',
                'district' => 'Hambantota',
            ],
            [
                'name_en' => 'Weeraketiya Divisional Secretariat',
                'name_si' => 'වීරකැටිය',
                'code' => 'HAMBANTOTA_WEERAKETIYA',
                'district' => 'Hambantota',
            ],
        ];

        foreach ($offices as $office) {
            DsOffice::updateOrCreate(
                [
                    'code' => $office['code'],
                ],
                [
                    'name_en' => $office['name_en'],
                    'name_si' => $office['name_si'],
                    'district' => $office['district'],
                    'is_active' => true,
                ]
            );
        }
    }
}