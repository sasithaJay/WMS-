<?php

namespace Database\Seeders;

use App\Models\ItemCategory;
use App\Models\Unit;
use Illuminate\Database\Seeder;

class InventoryReferenceSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            [
                'name_en' => 'Stationery',
                'name_si' => 'ලිපි ද්‍රව්‍ය',
                'code' => 'STATIONERY',
            ],
            [
                'name_en' => 'Office Equipment',
                'name_si' => 'කාර්යාල උපකරණ',
                'code' => 'OFFICE_EQUIPMENT',
            ],
            [
                'name_en' => 'Computer Equipment',
                'name_si' => 'පරිගණක උපකරණ',
                'code' => 'COMPUTER_EQUIPMENT',
            ],
            [
                'name_en' => 'Filing',
                'name_si' => 'ගොනු ද්‍රව්‍ය',
                'code' => 'FILING',
            ],
        ];

        foreach ($categories as $category) {
            ItemCategory::updateOrCreate(
                ['code' => $category['code']],
                $category
            );
        }

        $units = [
            ['name_en' => 'Piece', 'name_si' => 'කැබැල්ල', 'symbol' => 'pcs'],
            ['name_en' => 'Box', 'name_si' => 'පෙට්ටිය', 'symbol' => 'box'],
            ['name_en' => 'Bundle', 'name_si' => 'ගොන්න', 'symbol' => 'bundle'],
            ['name_en' => 'Packet', 'name_si' => 'පැකට්ටුව', 'symbol' => 'pkt'],
            ['name_en' => 'Bottle', 'name_si' => 'බෝතලය', 'symbol' => 'btl'],
            ['name_en' => 'Ream', 'name_si' => 'රීමය', 'symbol' => 'ream'],
            ['name_en' => 'Kilogram', 'name_si' => 'කිලෝග්‍රෑම්', 'symbol' => 'kg'],
            ['name_en' => 'Litre', 'name_si' => 'ලීටර්', 'symbol' => 'L'],
            ['name_en' => 'Set', 'name_si' => 'කට්ටලය', 'symbol' => 'set'],
            ['name_en' => 'Roll', 'name_si' => 'රෝල', 'symbol' => 'roll'],
            ['name_en' => 'Cartridge', 'name_si' => 'කාට්රිජය', 'symbol' => 'cart'],
        ];

        foreach ($units as $unit) {
            Unit::updateOrCreate(
                ['name_en' => $unit['name_en']],
                $unit
            );
        }
    }
}