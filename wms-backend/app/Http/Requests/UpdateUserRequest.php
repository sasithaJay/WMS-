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
            'email' => [
                'sometimes',
                'nullable',
                'email',
                Rule::unique('users', 'email')->ignore($this->route('user')?->id),
            ],
            'phone' => ['sometimes', 'nullable', 'string', 'max:20'],
            'full_name' => ['sometimes', 'string', 'max:255'],
            'role_id' => ['sometimes', 'exists:roles,id'],
            'division_id' => ['sometimes', 'exists:divisions,id'],
            'section_id' => ['nullable', 'exists:sections,id'],
            'account_status' => ['sometimes', Rule::in(['ACTIVE', 'SUSPENDED'])],
        ];
    }
}