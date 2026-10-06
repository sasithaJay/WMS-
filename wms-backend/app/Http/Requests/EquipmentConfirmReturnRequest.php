<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EquipmentConfirmReturnRequest extends FormRequest
{
    public function authorize(): bool { return true; }

    public function rules(): array
    {
        return [
            'condition' => ['required', 'in:GOOD,DAMAGED,MALFUNCTIONED,BEYOND_REPAIR'],
            'remarks' => ['nullable', 'string', 'max:1000'],
        ];
    }
}