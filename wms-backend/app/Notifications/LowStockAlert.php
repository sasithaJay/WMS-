<?php

namespace App\Notifications;

use App\Notifications\Channels\SmsChannel;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Collection;

class LowStockAlert extends Notification
{
    public function __construct(
        protected Collection $items,
        protected string $divisionName,
    ) {
    }

    public function via($notifiable): array
    {
        return ['database', SmsChannel::class];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'low_stock_alert',
            'division_name' => $this->divisionName,
            'item_count' => $this->items->count(),
            'item_codes' => $this->items->pluck('item_code')->values(),
            'items' => $this->items->map(fn ($item) => [
                'item_code' => $item->item_code,
                'name' => $item->name_en,
                'quantity_on_hand' => (float) $item->quantity_on_hand,
                'reorder_level' => (float) $item->reorder_level,
                'status' => (float) $item->quantity_on_hand <= 0 ? 'out_of_stock' : 'low_stock',
            ])->values(),
        ];
    }

    public function toSms($notifiable): string
    {
        $items = $this->items->map(fn ($item) => sprintf(
            '%s %s (%s)',
            $item->item_code,
            $item->name_en,
            (float) $item->quantity_on_hand <= 0 ? 'OUT' : 'LOW'
        ));

        return "WMS {$this->divisionName}: " . $items->implode('; ');
    }
}
