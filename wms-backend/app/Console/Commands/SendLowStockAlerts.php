<?php

namespace App\Console\Commands;

use App\Models\Division;
use App\Models\Item;
use App\Models\User;
use App\Notifications\LowStockAlert;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;

class SendLowStockAlerts extends Command
{
    protected $signature = 'stock:low-stock-alerts';
    protected $description = 'Send a daily digest of low/out-of-stock items to each division\'s Store Keeper(s)';

    public function handle(): int
    {
        $divisions = Division::all();

        foreach ($divisions as $division) {
            $lowStockItems = Item::query()
                ->where('items.division_id', $division->id)
                ->where('items.is_active', true)
                ->leftJoin('inventory_balances', function ($join) use ($division) {
                    $join->on('inventory_balances.item_id', '=', 'items.id')
                        ->where('inventory_balances.division_id', '=', $division->id);
                })
                ->whereRaw('COALESCE(inventory_balances.quantity_on_hand, 0) <= items.reorder_level')
                ->select([
                    'items.id',
                    'items.item_code',
                    'items.name_en',
                    'items.reorder_level',
                    DB::raw('COALESCE(inventory_balances.quantity_on_hand, 0) as quantity_on_hand'),
                ])
                ->get();

            if ($lowStockItems->isEmpty()) {
                continue;
            }

            $storeKeepers = User::whereHas('staffProfile', fn ($q) =>
                $q->where('division_id', $division->id)
                    ->whereHas('role', fn ($rq) => $rq->where('code', 'STORE_KEEPER'))
            )->get();

            foreach ($storeKeepers as $storeKeeper) {
                $storeKeeper->notify(new LowStockAlert($lowStockItems));
            }

            $this->info("Division [{$division->name_en}]: {$lowStockItems->count()} low-stock item(s), notified {$storeKeepers->count()} store keeper(s).");
        }

        return self::SUCCESS;
    }
}