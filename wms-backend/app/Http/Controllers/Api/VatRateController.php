<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\VatRate;
use App\Notifications\VatRateStatusChanged;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VatRateController extends Controller
{
    /**
     * The currently active VAT rate — anyone who can view stock receipts
     * needs this to know what will be applied.
     */
    public function current(): JsonResponse
    {
        return response()->json([
            'data' => [
                'percentage' => VatRate::currentPercentage(),
            ],
        ]);
    }

    /**
     * Store Keeper's own submitted VAT change requests.
     */
    public function myRequests(Request $request): JsonResponse
    {
        $rates = VatRate::with(['requester.staffProfile', 'reviewer.staffProfile'])
            ->where('requested_by', $request->user()->id)
            ->latest()
            ->paginate(15);

        return response()->json($rates);
    }

    /**
     * Store Keeper proposes a new VAT percentage.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'percentage' => ['required', 'numeric', 'min:0', 'max:100'],
        ]);

        $hasPending = VatRate::where('status', 'PENDING')->exists();

        abort_if(
            $hasPending,
            422,
            'There is already a pending VAT change request awaiting review.'
        );

        $vatRate = VatRate::create([
            'percentage' => $validated['percentage'],
            'status' => 'PENDING',
            'requested_by' => $request->user()->id,
        ]);

        // Notify Commissioner(s) — VAT approval is Commissioner-only,
        // unlike item updates which AO/Accountant can also review.
        $commissioners = \App\Models\User::whereHas('staffProfile.role', fn ($q) =>
            $q->where('code', 'COMMISSIONER')
        )->get();

        foreach ($commissioners as $commissioner) {
            $commissioner->notify(new VatRateStatusChanged($vatRate, 'SUBMITTED'));
        }

        return response()->json([
            'message' => 'VAT rate change request submitted for approval.',
            'data' => $vatRate,
        ], 201);
    }

    /**
     * Commissioner's pending VAT review queue.
     */
    public function pending(): JsonResponse
    {
        $rates = VatRate::with(['requester.staffProfile'])
            ->where('status', 'PENDING')
            ->latest()
            ->paginate(15);

        return response()->json($rates);
    }

    public function approve(Request $request, VatRate $vatRate): JsonResponse
    {
        abort_if($request->user()->staffProfile?->role?->code !== 'COMMISSIONER', 403, 'Only the Commissioner can approve VAT rate changes.');

        abort_unless($vatRate->status === 'PENDING', 422, 'This request has already been reviewed.');

        $validated = $request->validate([
            'review_comment' => ['nullable', 'string', 'max:1000'],
        ]);

        $vatRate->update([
            'status' => 'APPROVED',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_comment' => $validated['review_comment'] ?? null,
        ]);

        $vatRate->requester?->notify(new VatRateStatusChanged($vatRate->fresh(), 'APPROVED'));

        return response()->json([
            'message' => 'VAT rate approved successfully.',
            'data' => $vatRate,
        ]);
    }

    public function reject(Request $request, VatRate $vatRate): JsonResponse
    {
        abort_if($request->user()->staffProfile?->role?->code !== 'COMMISSIONER', 403, 'Only the Commissioner can review VAT rate changes.');

        abort_unless($vatRate->status === 'PENDING', 422, 'This request has already been reviewed.');

        $validated = $request->validate([
            'review_comment' => ['required', 'string', 'max:1000'],
        ]);

        $vatRate->update([
            'status' => 'REJECTED',
            'reviewed_by' => $request->user()->id,
            'reviewed_at' => now(),
            'review_comment' => $validated['review_comment'],
        ]);

        $vatRate->requester?->notify(new VatRateStatusChanged($vatRate->fresh(), 'REJECTED'));

        return response()->json([
            'message' => 'VAT rate change rejected.',
            'data' => $vatRate,
        ]);
    }
}