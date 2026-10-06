<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StockRequestItemApproveRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'quantity' => ['required', 'numeric', 'gt:0'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}