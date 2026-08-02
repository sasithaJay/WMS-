<?php

namespace App\Notifications\Channels;

use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class SmsChannel
{
    public function send($notifiable, Notification $notification): void
    {
        if (! method_exists($notification, 'toSms')) {
            return;
        }

        $phone = $notifiable->staffProfile?->phone ?? $notifiable->organization?->contact_number ?? null;

        if (! $phone) {
            return;
        }

        $message = $notification->toSms($notifiable);

        $endpoint = config('services.sms.endpoint');
        $apiKey = config('services.sms.api_key');

        if (! $endpoint || ! $apiKey) {
            Log::info("SMS not sent (gateway not configured): to={$phone}, message={$message}");
            return;
        }

        try {
            Http::withToken($apiKey)->post($endpoint, [
                'to' => $phone,
                'message' => $message,
            ]);
        } catch (\Throwable $e) {
            // Never let a failed SMS break the calling request/approval flow.
            Log::error("SMS send failed: {$e->getMessage()}");
        }
    }
}