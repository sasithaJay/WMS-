<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateStockReceiptRequest extends FormRequest
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
}