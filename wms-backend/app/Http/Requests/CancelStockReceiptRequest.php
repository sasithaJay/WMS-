<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CancelStockReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'reason' => [
                'required',
                'string',
                'max:500',
            ],
        ];
    }
}