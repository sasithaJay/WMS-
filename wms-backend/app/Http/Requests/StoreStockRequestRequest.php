<?php

namespace App\Http\Requests;

use App\Models\DsOffice;
use App\Models\Organization;
use Illuminate\Contracts\Validation\Validator;
use Illuminate\Foundation\Http\FormRequest;

class StoreStockRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
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

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator) {
            if ($this->input('request_context') === 'INSTITUTION') {
                $organization = Organization::find($this->input('organization_id'));

                if ($organization && $organization->organization_kind !== 'INSTITUTION') {
                    $validator->errors()->add('organization_id', 'The selected organization is not an Institution.');
                }
            }

            if ($this->input('request_context') === 'DS_OFFICE') {
                $dsOffice = DsOffice::find($this->input('ds_office_id'));

                if ($dsOffice && ! $dsOffice->is_active) {
                    $validator->errors()->add('ds_office_id', 'This Divisional Secretary Office is not active.');
                }
            }

            $items = $this->input('items', []);
            $itemIds = collect($items)->pluck('item_id')->filter();

            if ($itemIds->isNotEmpty()) {
                // Determine target division the same way the service will —
                // Commissioner's explicit choice, otherwise their own division.
                $targetDivisionId = $this->user()->staffProfile?->role?->code === 'COMMISSIONER'
                    ? ($this->input('division_id') ?: $this->user()->staffProfile?->division_id)
                    : $this->user()->staffProfile?->division_id;

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

        });
    }

    public function failedAuthorization(): void
    {
        abort(403, 'Only an Administrative Officer can submit a request on behalf of a Divisional Secretary Office.');
    }
}