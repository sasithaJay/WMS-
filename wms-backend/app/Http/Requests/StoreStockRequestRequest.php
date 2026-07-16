<?php

// app/Http/Requests/StoreStockRequestRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'request_context' => ['required', 'in:PERSONAL,SECTION_COMMON,INSTITUTION,DS_OFFICE'],
            'division_id' => ['nullable', 'exists:divisions,id'], // only honored for Commissioner
            'notes' => ['nullable', 'string'],

            'items' => ['required', 'array', 'min:1'],
            'items.*.item_id' => ['required', 'exists:items,id', 'distinct'],
            'items.*.quantity_requested' => ['required', 'numeric', 'gt:0'],
            'items.*.remarks' => ['nullable', 'string'],
        ];
    }
}