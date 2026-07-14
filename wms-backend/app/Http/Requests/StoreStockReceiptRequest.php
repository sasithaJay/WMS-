<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreStockReceiptRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [

            'supplier_name' => [
                'required',
                'string',
                'max:255',
            ],

            'invoice_number' => [
                'nullable',
                'string',
                'max:255',
            ],

            'received_date' => [
                'required',
                'date',
            ],

            'notes' => [
                'nullable',
                'string',
            ],

            'items' => [
                'required',
                'array',
                'min:1',
            ],

            'items.*.item_id' => [
                'required',
                'exists:items,id',
                'distinct',
            ],

            'items.*.quantity_received' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'items.*.unit_cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'items.*.remarks' => [
                'nullable',
                'string',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'items.required' => 'At least one item is required.',
            'items.min' => 'Add at least one item.',
            'items.*.item_id.distinct' => 'The same item cannot appear twice.',
            'items.*.quantity_received.gt' => 'Quantity must be greater than zero.',
        ];
    }
}