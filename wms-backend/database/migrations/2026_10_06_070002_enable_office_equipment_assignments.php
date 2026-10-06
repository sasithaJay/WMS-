<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::table('item_categories')
            ->where('code', 'OFFICE_EQUIPMENT')
            ->update(['is_returnable' => true]);

        $issuedItems = DB::table('stock_request_items as sri')
            ->join('stock_requests as sr', 'sr.id', '=', 'sri.stock_request_id')
            ->join('items as i', 'i.id', '=', 'sri.item_id')
            ->join('item_categories as ic', 'ic.id', '=', 'i.category_id')
            ->where('ic.is_returnable', true)
            ->where('sri.quantity_issued', '>', 0)
            ->select('sri.id as stock_request_item_id', 'sri.item_id', 'sr.requester_id', 'sri.quantity_issued')
            ->get();

        foreach ($issuedItems as $issuedItem) {
            $existing = DB::table('equipment_assignments')
                ->where('stock_request_item_id', $issuedItem->stock_request_item_id)
                ->count();
            $missing = max(0, (int) floor((float) $issuedItem->quantity_issued) - $existing);

            for ($unit = 0; $unit < $missing; $unit++) {
                DB::table('equipment_assignments')->insert([
                    'item_id' => $issuedItem->item_id,
                    'stock_request_item_id' => $issuedItem->stock_request_item_id,
                    'assigned_to' => $issuedItem->requester_id,
                    'issued_by' => $issuedItem->requester_id,
                    'issued_at' => now(),
                    'status' => 'ASSIGNED',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }

    public function down(): void
    {
        DB::table('equipment_assignments')
            ->whereIn('stock_request_item_id', function ($query) {
                $query->select('sri.id')
                    ->from('stock_request_items as sri')
                    ->join('items as i', 'i.id', '=', 'sri.item_id')
                    ->join('item_categories as ic', 'ic.id', '=', 'i.category_id')
                    ->where('ic.code', 'OFFICE_EQUIPMENT');
            })->delete();

        DB::table('item_categories')
            ->where('code', 'OFFICE_EQUIPMENT')
            ->update(['is_returnable' => false]);
    }
};
