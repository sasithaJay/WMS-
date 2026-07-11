<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateItemRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $item = $this->route('item');

        return [
            'division_id' => [
                'required',
                'integer',
                'exists:divisions,id',
            ],

            'category_id' => [
                'required',
                Rule::exists('item_categories', 'id')
                    ->where('is_active', true),
            ],

            'unit_id' => [
                'required',
                Rule::exists('units', 'id')
                    ->where('is_active', true),
            ],

            'item_code' => [
                'required',
                'string',
                'max:50',
                Rule::unique('items', 'item_code')
                    ->ignore($item->id),
            ],

            'name_en' => [
                'required',
                'string',
                'max:255',
            ],

            'name_si' => [
                'nullable',
                'string',
                'max:255',
            ],

            'description' => [
                'nullable',
                'string',
            ],

            'barcode' => [
                'nullable',
                'string',
                'max:100',
                Rule::unique('items', 'barcode')
                    ->ignore($item->id),
            ],

            'reorder_level' => [
                'required',
                'integer',
                'min:0',
            ],
        ];
    }
}