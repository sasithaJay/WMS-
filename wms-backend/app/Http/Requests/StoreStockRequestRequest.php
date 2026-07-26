<?php

// app/Http/Requests/StoreStockRequestRequest.php

namespace App\Http\Requests;

use App\Models\DsOffice;
use App\Models\Item;
use App\Models\Organization;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreStockRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Role-based restriction for DS_OFFICE lives here since it's a
        // permission check (who is allowed to submit this kind of request),
        // not a data-shape validation rule.
        if ($this->input('request_context') === 'DS_OFFICE') {
            return $this->user()?->staffProfile?->role?->code === 'ADMINISTRATIVE_OFFICER';
        }

        return true;
    }

    public function rules(): array
    {
        return [
            'request_context' => ['required', 'in:PERSONAL,SECTION_COMMON,INSTITUTION,DS_OFFICE'],
            'division_id' => ['nullable', 'exists:divisions,id'], // only honored for Commissioner

            'organization_id' => [
                'nullable',
                'required_if:request_context,INSTITUTION',
                'exists:organizations,id',
            ],

            'ds_office_id' => [
                'nullable',
                'required_if:request_context,DS_OFFICE',
                'exists:ds_offices,id',
            ],

            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id', 'distinct'],
            'items.*.quantity_requested' => ['required', 'numeric', 'gt:0'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }

    /**
     * Cross-field checks that go beyond simple rule validation.
     */
    public function withValidator(Validator $validator): void
{
    $validator->after(function (Validator $validator) {
        $validator->after(function (Validator $validator) {
            $this->validateInstitutionOrganization($validator);
            $this->validateDsOffice($validator);
            $this->validateItemsBelongToTargetDivision($validator);
        });

        $items = $this->input('items', []);
        $itemIds = collect($items)->pluck('item_id')->filter();

        if ($itemIds->isNotEmpty()) {
            $targetDivisionId = $this->resolveTargetDivisionId();

            if ($targetDivisionId) {
                $invalidItemIds = \App\Models\Item::whereIn('id', $itemIds)
                    ->where('division_id', '!=', $targetDivisionId)
                    ->pluck('id');

                if ($invalidItemIds->isNotEmpty()) {
                    $validator->errors()->add(
                        'items',
                        'One or more selected items do not belong to the selected store/division.',
                    );
                }
            }
        }
    });
}

    /**
     * The selected organization must actually be an INSTITUTION, and it
     * must belong to the same division context as the request.
     */
    private function validateInstitutionOrganization(Validator $validator): void
    {
        if ($this->input('request_context') !== 'INSTITUTION') {
            return;
        }

        $organizationId = $this->input('organization_id');

        if (! $organizationId) {
            return; // already caught by required_if
        }

        $organization = Organization::find($organizationId);

        if (! $organization || $organization->organization_kind !== 'INSTITUTION') {
            $validator->errors()->add(
                'organization_id',
                'The selected organization is not an Institution.',
            );
        }
    }

    /**
     * The selected DS Office must be active.
     */
    private function validateDsOffice(Validator $validator): void
    {
        if ($this->input('request_context') !== 'DS_OFFICE') {
            return;
        }

        $dsOfficeId = $this->input('ds_office_id');

        if (! $dsOfficeId) {
            return; // already caught by required_if
        }

        $dsOffice = DsOffice::find($dsOfficeId);

        if ($dsOffice && ! $dsOffice->is_active) {
            $validator->errors()->add(
                'ds_office_id',
                'This Divisional Secretary Office is not active.',
            );
        }
    }

    /**
     * Every submitted item must belong to the division this request is
     * actually targeting — prevents a Commissioner (or anyone else) from
     * submitting items from the wrong store, and protects against stale
     * frontend state sending mismatched item_ids.
     */
    private function validateItemsBelongToTargetDivision(Validator $validator): void
    {
        $items = $this->input('items', []);
        $itemIds = collect($items)->pluck('item_id')->filter();

        if ($itemIds->isEmpty()) {
            return;
        }

        $targetDivisionId = $this->resolveTargetDivisionId();

        if (! $targetDivisionId) {
            $validator->errors()->add(
                'items',
                'Unable to determine which division this request applies to.',
            );
            return;
        }

        $invalidItemIds = Item::whereIn('id', $itemIds)
            ->where('division_id', '!=', $targetDivisionId)
            ->pluck('id');

        if ($invalidItemIds->isNotEmpty()) {
            $validator->errors()->add(
                'items',
                'One or more selected items do not belong to the selected store/division.',
            );
        }
    }

    /**
     * Resolves which division this request's items must belong to, based
     * on who's submitting and what context they selected. Mirrors the same
     * account-type-aware resolution used in StockRequestService and
     * ItemController — every account type (staff, Commissioner, institution,
     * AO-on-behalf-of-DS-office) is handled explicitly, no silent nulls.
     */
    private function resolveTargetDivisionId(): ?int
    {
        $user = $this->user();

        // AO submitting on behalf of a DS Office — division comes from the
        // AO's own staff profile, not the DS office (which has no fixed
        // division of its own).
        if ($this->input('request_context') === 'DS_OFFICE') {
            return $user->staffProfile?->division_id;
        }

        // Institution accounts logging in directly — division comes from
        // their linked organization, since they have no staff profile.
        if (in_array($user->account_type, ['INSTITUTION', 'DS_OFFICE'], true)) {
            return $user->organization?->division_id;
        }

        // Commissioner may explicitly choose a division.
        if ($user->staffProfile?->role?->code === 'COMMISSIONER') {
            return $this->input('division_id') ?: $user->staffProfile?->division_id;
        }

        // Everyone else — locked to their own division.
        return $user->staffProfile?->division_id;
    }

    public function failedAuthorization(): void
    {
        abort(403, 'Only an Administrative Officer can submit a request on behalf of a Divisional Secretary Office.');
    }
}