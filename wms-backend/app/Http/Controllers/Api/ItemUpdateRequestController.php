<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreItemUpdateRequest;
use App\Models\Item;
use App\Models\ItemUpdateRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use App\Models\Role;
use App\Models\User;
use App\Notifications\ItemUpdateRequestStatusChanged;

class ItemUpdateRequestController extends Controller
{
    public function store(
        StoreItemUpdateRequest $request,
        Item $item
    ): JsonResponse {
        $user = $request->user();
        $divisionId = $user->staffProfile?->division_id;

        abort_unless(
            $item->division_id === $divisionId,
            403,
            'You cannot request changes for another division.'
        );

        $hasPendingRequest = ItemUpdateRequest::query()
            ->where('item_id', $item->id)
            ->where('status', 'PENDING')
            ->exists();

        abort_if(
            $hasPendingRequest,
            422,
            'This item already has a pending update request.'
        );

        $validated = $request->validated();
        $reason = $validated['reason'];

        unset($validated['reason']);

        $oldValues = [
            'category_id' => $item->category_id,
            'unit_id' => $item->unit_id,
            'item_code' => $item->item_code,
            'name_en' => $item->name_en,
            'description' => $item->description,
            'barcode' => $item->barcode,
            'reorder_level' => $item->reorder_level,
        ];

        $updateRequest = ItemUpdateRequest::create([
            'item_id' => $item->id,
            'requested_by' => $user->id,
            'old_values' => $oldValues,
            'new_values' => $validated,
            'status' => 'PENDING',
            'reason' => $reason,
        ]);

        $reviewerRoleIds = Role::whereHas('permissions', fn ($q) =>
            $q->where('code', 'inventory.update.approve')
        )->pluck('id');

        $reviewers = User::whereHas('staffProfile', fn ($q) =>
            $q->whereIn('role_id', $reviewerRoleIds)->where('division_id', $item->division_id)
        )->get();

        foreach ($reviewers as $reviewer) {
            $reviewer->notify(new ItemUpdateRequestStatusChanged($updateRequest, 'SUBMITTED'));
        }


        return response()->json([
            'message' => 'Item update request submitted successfully.',
            'data' => $updateRequest,
        ], 201);
    }

    public function myRequests(Request $request): JsonResponse
    {
        $requests = ItemUpdateRequest::query()
            ->with([
                'item:id,item_code,name_en',
                'reviewer:id,username',
            ])
            ->where('requested_by', $request->user()->id)
            ->latest()
            ->paginate(15);

        return response()->json($requests);
    }

    public function pending(Request $request): JsonResponse
    {
        $divisionId = $request->user()->staffProfile?->division_id;

        $requests = ItemUpdateRequest::query()
            ->with([
                'item.category',
                'item.unit',
                'requester.staffProfile',
            ])
            ->where('status', 'PENDING')
            ->whereHas('item', function ($query) use ($divisionId) {
                $query->where('division_id', $divisionId);
            })
            ->latest()
            ->paginate(15);

        return response()->json($requests);
    }

    public function approve(
        Request $request,
        ItemUpdateRequest $itemUpdateRequest
    ): JsonResponse {
        $validated = $request->validate([
            'review_comment' => [
                'nullable',
                'string',
                'max:1000',
            ],
        ]);

        abort_unless(
            $itemUpdateRequest->status === 'PENDING',
            422,
            'This request has already been reviewed.'
        );

        $reviewerDivisionId =
            $request->user()->staffProfile?->division_id;

        abort_unless(
            $itemUpdateRequest->item->division_id === $reviewerDivisionId,
            403,
            'You cannot review requests from another division.'
        );

        DB::transaction(function () use (
            $itemUpdateRequest,
            $request,
            $validated
        ) {
            $lockedRequest = ItemUpdateRequest::query()
                ->lockForUpdate()
                ->findOrFail($itemUpdateRequest->id);

            abort_unless(
                $lockedRequest->status === 'PENDING',
                422,
                'This request has already been reviewed.'
            );

            $item = Item::query()
                ->lockForUpdate()
                ->findOrFail($lockedRequest->item_id);

            validator(
                $lockedRequest->new_values,
                [
                    'category_id' => [
                        'required',
                        'exists:item_categories,id',
                    ],
                    'unit_id' => [
                        'required',
                        'exists:units,id',
                    ],
                    'item_code' => [
                        'required',
                        'string',
                        'max:50',
                        Rule::unique('items', 'item_code')
                            ->ignore($item->id),
                    ],
                    'name_en' => [
                        'required',
                        'string',
                        'max:255',
                    ],
                    'description' => [
                        'nullable',
                        'string',
                    ],
                    'barcode' => [
                        'nullable',
                        'string',
                        'max:100',
                        Rule::unique('items', 'barcode')
                            ->ignore($item->id),
                    ],
                    'reorder_level' => [
                        'required',
                        'integer',
                        'min:0',
                    ],
                ]
            )->validate();

            $item->update($lockedRequest->new_values);

            $lockedRequest->update([
                'status' => 'APPROVED',
                'reviewed_by' => $request->user()->id,
                'review_comment' =>
                    $validated['review_comment'] ?? null,
                'reviewed_at' => now(),
            ]);
        });

        $itemUpdateRequest->requester?->notify(
            new ItemUpdateRequestStatusChanged($itemUpdateRequest->fresh(), 'APPROVED', $request->user())
        );

        return response()->json([
            'message' => 'Item update request approved successfully.',
        ]);
    }

    public function reject(
        Request $request,
        ItemUpdateRequest $itemUpdateRequest
    ): JsonResponse {
        $validated = $request->validate([
            'review_comment' => [
                'required',
                'string',
                'max:1000',
            ],
        ]);

        abort_unless(
            $itemUpdateRequest->status === 'PENDING',
            422,
            'This request has already been reviewed.'
        );

        $reviewerDivisionId =
            $request->user()->staffProfile?->division_id;

        abort_unless(
            $itemUpdateRequest->item->division_id === $reviewerDivisionId,
            403,
            'You cannot review requests from another division.'
        );

        $itemUpdateRequest->update([
            'status' => 'REJECTED',
            'reviewed_by' => $request->user()->id,
            'review_comment' => $validated['review_comment'],
            'reviewed_at' => now(),
        ]);

        $itemUpdateRequest->requester?->notify(
            new ItemUpdateRequestStatusChanged($itemUpdateRequest, 'REJECTED', $request->user())
        );

        return response()->json([
            'message' => 'Item update request rejected.',
        ]);
    }
}