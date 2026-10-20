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

        $phone = $notifiable->staffProfile?->phone
            ?? $notifiable->organization?->contact_number
            ?? null;

        if (! $phone) {
            return;
        }

        $message = $notification->toSms($notifiable);

        // Keep existing notification behaviour unchanged.
        $this->sendToPhone($phone, $message);
    }

    /**
     * Send an SMS directly to a phone number.
     *
     * This is reusable for cases where there is no existing
     * notifiable/user yet, such as registration OTP.
     */
    public function sendToPhone(string $phone, string $message): bool
    {
        $userId = config('services.sms.user_id');
        $password = config('services.sms.password');

        if (! $userId || ! $password) {
            Log::info(
                "SMS not sent (gateway not configured): to={$phone}, message={$message}"
            );

            return false;
        }

        $normalizedPhone = $this->normalizePhone($phone);

        if (! $normalizedPhone) {
            Log::warning(
                "SMS not sent (invalid phone format): raw={$phone}"
            );

            return false;
        }

        try {
            $response = Http::timeout(10)->get(
                'http://www.textit.biz/sendmsg',
                [
                    'id' => $userId,
                    'pw' => $password,
                    'to' => $normalizedPhone,
                    'text' => $message,
                ]
            );

            $firstLine = trim(
                explode("\n", $response->body())[0] ?? ''
            );

            if (! str_starts_with($firstLine, 'OK')) {
                Log::warning(
                    "SMS gateway reported failure: " .
                    "to={$normalizedPhone}, response={$firstLine}"
                );

                return false;
            }

            return true;

        } catch (\Throwable $e) {
            // Never let existing SMS notifications break the main flow.
            Log::error("SMS send failed: {$e->getMessage()}");

            return false;
        }
    }

    /**
     * textit.biz expects:
     * 94771234567
     *
     * Example:
     * 0771234567 -> 94771234567
     */
    private function normalizePhone(string $phone): ?string
    {
        $digits = preg_replace('/\D/', '', $phone);

        if (str_starts_with($digits, '94')) {
            return $digits;
        }

        if (str_starts_with($digits, '0') && strlen($digits) === 10) {
            return '94' . substr($digits, 1);
        }

        return null;
    }
}