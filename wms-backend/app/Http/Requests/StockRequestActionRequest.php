<?php

// app/Http/Requests/StockRequestActionRequest.php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockRequestActionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'remarks' => ['nullable', 'string'],
            'items' => ['nullable', 'array'],
            'items.*.item_id' => ['required_with:items', 'exists:items,id'],
            'items.*.quantity' => ['required_with:items', 'numeric', 'gt:0'],
        ];
    }
}