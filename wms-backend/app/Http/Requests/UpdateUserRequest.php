<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateUserRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'full_name' => ['sometimes', 'string', 'max:255'],
            'role_id' => ['sometimes', 'exists:roles,id'],
            'division_id' => ['sometimes', 'exists:divisions,id'],
            'section_id' => ['nullable', 'exists:sections,id'],
            'account_status' => ['sometimes', Rule::in(['ACTIVE', 'SUSPENDED'])],
        ];
    }
}