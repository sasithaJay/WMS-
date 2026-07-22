<?php

// app/Http/Requests/StoreStockRequestRequest.php

namespace App\Http\Requests;

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
            'division_id' => ['nullable', 'exists:divisions,id'], 
            'organization_id' => [
                'nullable',
                'required_if:request_context,DS_OFFICE',
                'exists:organizations,id',
            ],

            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id', 'distinct'],
            'items.*.quantity_requested' => ['required', 'numeric', 'gt:0'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }

    /**
     * Cross-field checks that go beyond simple rule validation:
     * the organization must actually be a DS_OFFICE, and it must belong
     * to the submitting AO's own division.
     */
    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('request_context') !== 'DS_OFFICE') {
                return;
            }

            $organizationId = $this->input('organization_id');

            if (! $organizationId) {
                return; // already caught by required_if above
            }

            $organization = Organization::find($organizationId);

            if (! $organization || $organization->organization_kind !== 'DS_OFFICE') {
                $validator->errors()->add(
                    'organization_id',
                    'The selected organization is not a Divisional Secretary Office.',
                );
                return;
            }

            $aoDivisionId = $this->user()?->staffProfile?->division_id;

            if ($organization->division_id !== $aoDivisionId) {
                $validator->errors()->add(
                    'organization_id',
                    'You may only submit requests for a Divisional Secretary Office in your own division.',
                );
            }
        });
    }

    public function failedAuthorization(): void
    {
        abort(403, 'Only an Administrative Officer can submit a request on behalf of a Divisional Secretary Office.');
    }
}