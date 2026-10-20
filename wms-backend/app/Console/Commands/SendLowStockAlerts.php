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
    protected $description = 'Send daily low/out-of-stock dashboard and SMS alerts to the assigned division roles';

    public function handle(): int
    {
        $divisions = Division::all();
        $commissioners = User::whereHas('staffProfile.role', fn ($query) =>
            $query->where('code', 'COMMISSIONER')
        )->get();

        foreach ($divisions as $division) {
            $items = Item::query()
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
                ->orderBy('items.item_code')
                ->get();

            if ($items->isEmpty()) {
                continue;
            }

            $roleCodes = $division->code === 'SOCIAL_SERVICES'
                ? ['ASSISTANT_DIRECTOR', 'ACCOUNTANT', 'ADMINISTRATIVE_OFFICER', 'STORE_KEEPER']
                : ($division->code === 'CHILD_SERVICES'
                    ? ['ASSISTANT_COMMISSIONER', 'ADMINISTRATIVE_OFFICER', 'STORE_KEEPER']
                    : []);

            $recipients = User::whereHas('staffProfile', function ($query) use ($division, $roleCodes) {
                $query->where('division_id', $division->id)
                    ->whereHas('role', fn ($roles) => $roles->whereIn('code', $roleCodes));
            })->get();

            foreach ($commissioners as $commissioner) {
                $commissioner->notify(new LowStockAlert($items, $division->name_en));
            }

            foreach ($recipients as $recipient) {
                $recipient->notify(new LowStockAlert($items, $division->name_en));
            }

            $this->info("Division [{$division->name_en}]: {$items->count()} low/out-of-stock item(s), notified {$recipients->count()} division role(s).");
        }

        return self::SUCCESS;
    }
}
