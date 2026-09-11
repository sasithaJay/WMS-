<?php

namespace App\Notifications;

use App\Models\ItemUpdateRequest;
use App\Models\User;
use App\Notifications\Channels\SmsChannel;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;

class ItemUpdateRequestStatusChanged extends Notification
{
    use Queueable;

    public function __construct(
        protected ItemUpdateRequest $updateRequest,
        protected string $action,
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
            'type' => 'item_update_status_changed',
            'update_request_id' => $this->updateRequest->id,
            'item_id' => $this->updateRequest->item_id,
            'item_code' => $this->updateRequest->item?->item_code,
            'item_name' => $this->updateRequest->item?->name_en,
            'action' => $this->action,
            'reason' => $this->updateRequest->reason,
            'review_comment' => $this->updateRequest->review_comment,
            'old_values' => $this->updateRequest->old_values,
            'new_values' => $this->updateRequest->new_values,
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
        $itemName = $this->updateRequest->item?->name_en ?? 'an item';

        return (new MailMessage)
            ->subject("Item update request {$label}")
            ->greeting("Hello {$recipientName},")
            ->line("The update request for \"{$itemName}\" has been {$label}.")
            ->when(
                $this->action === 'REJECTED' && $this->updateRequest->review_comment,
                fn ($mail) => $mail->line("Reason: {$this->updateRequest->review_comment}")
            )
            ->line('Please check your dashboard for full details.');
    }

    public function toSms($notifiable): string
    {
        $label = $this->actionLabel();
        return "WMS: Item update request was {$label}.";
    }

    private function actionLabel(): string
    {
        return match ($this->action) {
            'SUBMITTED' => 'submitted for review',
            'APPROVED' => 'approved',
            'REJECTED' => 'rejected',
            default => strtolower($this->action),
        };
    }
}