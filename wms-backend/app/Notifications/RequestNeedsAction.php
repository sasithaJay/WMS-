<?php

namespace App\Notifications;

use App\Models\StockRequest;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class RequestNeedsAction extends Notification
{
    use Queueable;

    public function __construct(
        protected StockRequest $request,
        protected string $stage, // RECOMMENDATION or APPROVAL
    ) {
    }

    public function via($notifiable): array
    {
        return ['database', 'mail', SmsChannel::class];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'request_needs_action',
            'request_id' => $this->request->id,
            'request_number' => $this->request->request_number,
            'stage' => $this->stage,
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $recipientName = $notifiable->staffProfile?->full_name
            ?? $notifiable->organization?->name
            ?? $notifiable->username;

        $stageLabel = $this->stageLabel();

        return (new MailMessage)
            ->subject("Request {$this->request->request_number} needs your {$stageLabel}")
            ->greeting("Hello {$recipientName},")
            ->line("A new stock request, {$this->request->request_number}, is waiting for your {$stageLabel}.")
            ->line('Please log in to review it at your earliest convenience.');
    }

    public function toSms($notifiable): string
    {
        $stageLabel = $this->stageLabel();
        return "WMS: Request {$this->request->request_number} needs your {$stageLabel}.";
    }

    private function stageLabel(): string
    {
        return match ($this->stage) {
            'RECOMMENDATION' => 'recommendation',
            'APPROVAL' => 'approval',
            default => strtolower($this->stage),
        };
    }
}