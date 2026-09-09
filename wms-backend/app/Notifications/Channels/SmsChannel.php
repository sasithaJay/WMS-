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

        $userId = config('services.sms.user_id');
        $password = config('services.sms.password');

        if (! $userId || ! $password) {
            Log::info("SMS not sent (gateway not configured): to={$phone}, message={$message}");
            return;
        }

        $normalizedPhone = $this->normalizePhone($phone);

        if (! $normalizedPhone) {
            Log::warning("SMS not sent (invalid phone format): raw={$phone}");
            return;
        }

        try {
            $response = Http::timeout(10)->get('http://www.textit.biz/sendmsg', [
                'id' => $userId,
                'pw' => $password,
                'to' => $normalizedPhone,
                'text' => $message,
            ]);

            // textit.biz responds with plain text, first line shaped like
            // "OK:message_id" on success or "Sent Failed - Error:..." on failure.
            $firstLine = trim(explode("\n", $response->body())[0] ?? '');

            if (! str_starts_with($firstLine, 'OK')) {
                Log::warning("SMS gateway reported failure: to={$normalizedPhone}, response={$firstLine}");
            }
        } catch (\Throwable $e) {
            // Never let a failed SMS break the calling request/approval flow.
            Log::error("SMS send failed: {$e->getMessage()}");
        }
    }

    /**
     * textit.biz expects: country code + number, no leading zero, no plus sign.
     * e.g. "0771234567" -> "94771234567"
     */
    private function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', $phone);

        if (str_starts_with($digits, '94')) {
            return $digits; // already has country code
        }

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            return '94' . substr($digits, 1);
        }

        return null; // doesn't match a recognizable Sri Lankan number shape
    }
}