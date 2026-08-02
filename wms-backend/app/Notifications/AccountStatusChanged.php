<?php

namespace App\Notifications;

use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class AccountStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        protected string $status, // ACTIVE or REJECTED
        protected ?string $reason = null,
    ) {
    }

    public function via($notifiable): array
    {
        return ['database', 'mail', SmsChannel::class];
    }

    public function toArray($notifiable): array
    {
        return [
            'type' => 'account_status_changed',
            'status' => $this->status,
            'reason' => $this->reason,
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $recipientName = $notifiable->staffProfile?->full_name
            ?? $notifiable->organization?->name
            ?? $notifiable->username;

        if ($this->status === 'ACTIVE') {
            return (new MailMessage)
                ->subject('Your account has been approved')
                ->greeting("Hello {$recipientName},")
                ->line('Your account has been approved and is now active.')
                ->line('You can now log in and start using the system.');
        }

        return (new MailMessage)
            ->subject('Your account registration was not approved')
            ->greeting("Hello {$recipientName},")
            ->line('Your account registration was not approved.')
            ->when($this->reason, fn ($mail) => $mail->line("Reason: {$this->reason}"));
    }

    public function toSms($notifiable): string
    {
        return $this->status === 'ACTIVE'
            ? 'WMS: Your account has been approved and is now active.'
            : 'WMS: Your account registration was not approved.';
    }
}