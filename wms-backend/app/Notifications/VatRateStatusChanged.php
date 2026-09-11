<?php

namespace App\Notifications;

use App\Models\User;
use App\Models\VatRate;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class VatRateStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        protected VatRate $vatRate,
        protected string $action, // SUBMITTED, APPROVED, REJECTED
    ) {
    }

    public function via($notifiable): array
    {
        return ['database', 'mail', SmsChannel::class];
    }

    public function toArray($notifiable): array
    {
        $requesterName = $this->vatRate->requester?->staffProfile?->full_name
            ?? $this->vatRate->requester?->username;

        return [
            'type' => 'vat_rate_status_changed',
            'vat_rate_id' => $this->vatRate->id,
            'percentage' => (float) $this->vatRate->percentage,
            'action' => $this->action,
            'requester_name' => $requesterName,
            'review_comment' => $this->vatRate->review_comment,
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $label = $this->actionLabel();

        return (new MailMessage)
            ->subject("VAT rate change {$label}")
            ->line("A VAT rate change to {$this->vatRate->percentage}% has been {$label}.")
            ->when(
                $this->action === 'REJECTED' && $this->vatRate->review_comment,
                fn ($mail) => $mail->line("Reason: {$this->vatRate->review_comment}")
            );
    }

    public function toSms($notifiable): string
    {
        $label = $this->actionLabel();
        return "WMS: VAT rate change to {$this->vatRate->percentage}% has been {$label}.";
    }

    private function actionLabel(): string
    {
        return match ($this->action) {
            'SUBMITTED' => 'submitted for your approval',
            'APPROVED' => 'approved',
            'REJECTED' => 'rejected',
            default => strtolower($this->action),
        };
    }
}