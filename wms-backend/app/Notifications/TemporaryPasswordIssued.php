<?php

namespace App\Notifications;

use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class TemporaryPasswordIssued extends Notification
{
    use Queueable;

    public function __construct(
        private readonly string $temporaryPassword,
    ) {
    }

    public function via($notifiable): array
    {
        return [SmsChannel::class];
    }

    public function toSms($notifiable): string
    {
        return "WMS: Your temporary password is {$this->temporaryPassword}. Sign in and change it immediately.";
    }
}
