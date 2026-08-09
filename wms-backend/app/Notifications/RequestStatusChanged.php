<?php

namespace App\Notifications;

use App\Models\StockRequest;
use App\Models\User;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class RequestStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        protected StockRequest $request,
        protected string $action,
        protected ?string $remarks = null,
        protected ?User $actor = null,
    ) {
    }

    public function via($notifiable): array
    {
        return ['database', 'mail', SmsChannel::class];
    }

    public function toArray($notifiable): array
    {
        $actorName = $this->actor?->staffProfile?->full_name
            ?? $this->actor?->organization?->name
            ?? $this->actor?->username;

        $actorRole = $this->actor?->staffProfile?->role?->name_en;

        return [
            'type' => 'request_status_changed',
            'request_id' => $this->request->id,
            'request_number' => $this->request->request_number,
            'action' => $this->action,
            'remarks' => $this->remarks,
            'request_context' => $this->request->request_context,
            'item_count' => $this->request->items?->count(),
            'actor_name' => $actorName,
            'actor_role' => $actorRole,
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
            'PARTIALLY_ISSUED' => 'partially issued',
            default => strtolower($this->action),
        };
    }
}