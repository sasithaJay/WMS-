<?php

namespace App\Notifications;

use App\Models\User;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class NewAccountPendingApproval extends Notification
{
    use Queueable;

    public function __construct(
        protected User $applicant,
    ) {
    }

    public function via($notifiable): array
    {
        return ['database', 'mail', SmsChannel::class];
    }

    public function toArray($notifiable): array
    {
        $applicantName = $this->applicant->staffProfile?->full_name
            ?? $this->applicant->organization?->name
            ?? $this->applicant->username;

        $applicantRole = $this->applicant->staffProfile?->role?->name_en;

        return [
            'type' => 'new_account_pending',
            'user_id' => $this->applicant->id,
            'username' => $this->applicant->username,
            'applicant_name' => $applicantName,
            'applicant_role' => $applicantRole,
            'account_type' => $this->applicant->account_type,
        ];
    }

    public function toMail($notifiable): MailMessage
    {
        $applicantName = $this->applicant->staffProfile?->full_name
            ?? $this->applicant->organization?->name
            ?? $this->applicant->username;

        return (new MailMessage)
            ->subject('New account registration pending approval')
            ->greeting('Hello,')
            ->line("A new account registration from \"{$applicantName}\" ({$this->applicant->username}) is waiting for your approval.")
            ->line('Please log in to review it.');
    }

    public function toSms($notifiable): string
    {
        return "WMS: New account registration pending approval — @{$this->applicant->username}.";
    }
}