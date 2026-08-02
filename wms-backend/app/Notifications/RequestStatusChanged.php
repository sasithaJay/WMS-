<?php

namespace App\Notifications;

use App\Models\StockRequest;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class RequestStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        protected StockRequest $request,
        protected string $action, // RECOMMENDED, APPROVED, REJECTED, RETURNED, ISSUED
        protected ?string $remarks = null,
    ) {
    }

    public function via($notifiable): array
    {
        return ['database', 'mail', SmsChannel::class];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'request_status_changed',
            'request_id' => $this->request->id,
            'request_number' => $this->request->request_number,
            'action' => $this->action,
            'remarks' => $this->remarks,
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $recipientName = $notifiable->staffProfile?->full_name
            ?? $notifiable->organization?->name
            ?? $notifiable->username;

        $label = $this->actionLabel();

        return (new MailMessage)
            ->subject("Your request {$this->request->request_number} was {$label}")
            ->greeting("Hello {$recipientName},")
            ->line("Your stock request {$this->request->request_number} has been {$label}.")
            ->when($this->remarks, fn ($mail) => $mail->line("Remarks: {$this->remarks}"))
            ->line('Please check your dashboard for full details.');
    }

    public function toSms($notifiable): string
    {
        $label = $this->actionLabel();
        return "WMS: Your request {$this->request->request_number} was {$label}.";
    }

    private function actionLabel(): string
    {
        return match ($this->action) {
            'RECOMMENDED' => 'recommended',
            'APPROVED' => 'approved',
            'REJECTED' => 'rejected',
            'RETURNED' => 'returned for correction',
            'ISSUED' => 'issued',
            default => strtolower($this->action),
        };
    }
}