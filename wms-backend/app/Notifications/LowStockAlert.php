<?php

namespace App\Notifications;

use Illuminate\Support\Collection;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class LowStockAlert extends Notification
{
    use Queueable;

    public function __construct(
        protected Collection $items, // collection of Item models below reorder level
    ) {
    }

    public function via($notifiable): array
    {
        return ['database', 'mail', SmsChannel::class];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'low_stock_alert',
            'item_count' => $this->items->count(),
            'item_codes' => $this->items->pluck('item_code')->values(),
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $mail = (new MailMessage)
            ->subject("{$this->items->count()} item(s) are low on stock")
            ->greeting('Low Stock Alert')
            ->line('The following items are at or below their reorder level:');

        foreach ($this->items->take(15) as $item) {
            $mail->line("- {$item->item_code}: {$item->name_en}");
        }

        if ($this->items->count() > 15) {
            $mail->line('...and ' . ($this->items->count() - 15) . ' more.');
        }

        return $mail->line('Please review stock levels and initiate receiving as needed.');
    }

    public function toSms($notifiable): string
    {
        return "WMS: {$this->items->count()} item(s) are at or below reorder level. Check dashboard.";
    }
}