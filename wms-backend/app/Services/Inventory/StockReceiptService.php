<?php

namespace App\Services\Inventory;

use App\Models\StockReceipt;
use App\Models\VatRate;
use Illuminate\Support\Facades\DB;
use App\Models\InventoryBalance;
use App\Models\StockMovement;
use Illuminate\Validation\ValidationException;

class StockReceiptService
{
    /**
     * Create a new stock receipt (Draft)
     */
    public function create(array $data): StockReceipt
    {
        return DB::transaction(function () use ($data) {

            //
            // Generate GRN Number
            //

            $grnNumber = $this->generateGrnNumber();

            //
            // Create Receipt Header
            //

            $user = auth()->user();

            $divisionId = $user->staffProfile?->division_id;

            if (! $divisionId) {
                abort(403, 'Your account is not assigned to a division.');
            }

            $subtotal = collect($data['items'])->sum(
                fn ($item) => ($item['quantity_received']) * ($item['unit_cost'] ?? 0)
            );

            $vatPercentage = VatRate::currentPercentage();
            $vatAmount = round($subtotal * ($vatPercentage / 100), 2);
            $totalWithVat = round($subtotal + $vatAmount, 2);

            $receipt = StockReceipt::create([
                'division_id'    => $divisionId,
                'grn_number'     => $grnNumber,
                'supplier_name'  => $data['supplier_name'],
                'invoice_number' => $data['invoice_number'] ?? null,
                'received_date'  => $data['received_date'],
                'notes'          => $data['notes'] ?? null,
                'status'         => 'DRAFT',
                'created_by'     => $user->id,
                'subtotal' => round($subtotal, 2),
                'vat_percentage'   => $vatPercentage,
                'vat_amount'       => $vatAmount,
                'total_with_vat'   => $totalWithVat,
            ]);

            //
            // Create Receipt Items
            //

            foreach ($data['items'] as $item) {

                $receipt->items()->create([
                    'item_id'            => $item['item_id'],
                    'quantity_received'  => $item['quantity_received'],
                    'unit_cost'          => $item['unit_cost'] ?? null,
                    'remarks'            => $item['remarks'] ?? null,
                ]);
            }

            return $receipt->load('items.item');
        });
    }

    /**
     * Generate next GRN number.
     */
    private function generateGrnNumber(): string
    {
        $year = now()->year;

        $lastReceipt = StockReceipt::whereYear('created_at', $year)
            ->latest('id')
            ->first();

        if (! $lastReceipt) {
            $number = 1;
        } else {

            $parts = explode('-', $lastReceipt->grn_number);

            $number = (int) end($parts) + 1;
        }

        return sprintf(
            'GRN-%s-%06d',
            $year,
            $number
        );
    }

    /**
     * Confirm receipt.
     */
    public function confirm(StockReceipt $receipt): StockReceipt
    {
        return DB::transaction(function () use ($receipt) {

            if (! $receipt->isDraft()) {
                throw ValidationException::withMessages([
                    'receipt' => 'Only draft receipts can be confirmed.',
                ]);
            }

            $receipt->load('items');

            foreach ($receipt->items as $receiptItem) {

                $balance = InventoryBalance::lockForUpdate()
                    ->firstOrCreate(
                        [
                            'item_id' => $receiptItem->item_id,
                            'division_id' => $receipt->division_id,
                        ],
                        [
                            'quantity_on_hand' => 0,
                            'reserved_quantity' => 0,
                        ]
                    );

                $before = $balance->quantity_on_hand;

                $after = $before + $receiptItem->quantity_received;

                $balance->update([
                    'quantity_on_hand' => $after,
                ]);

                StockMovement::create([
                    'division_id'      => $receipt->division_id,
                    'item_id'          => $receiptItem->item_id,
                    'movement_type'    => 'RECEIPT',
                    'quantity'         => $receiptItem->quantity_received,
                    'balance_before'   => $before,
                    'balance_after'    => $after,
                    'reference_type'   => 'STOCK_RECEIPT',
                    'reference_id'     => $receipt->id,
                    'reference_number' => $receipt->grn_number,
                    'performed_by'     => auth()->id(),
                    'remarks'          => $receiptItem->remarks,
                ]);
            }

            $receipt->update([
                'status'       => 'CONFIRMED',
                'confirmed_by' => auth()->id(),
                'confirmed_at' => now(),
            ]);

            return $receipt->fresh([
                'items.item',
                'creator',
                'confirmer',
            ]);
        });
    }

    // Update an existing stock receipt (Draft)

    public function update(
        StockReceipt $receipt,
        array $data
    ): StockReceipt {

        if (! $receipt->isDraft()) {
            abort(422, 'Only draft receipts can be edited.');
        }

        return DB::transaction(function () use ($receipt, $data) {

            /*
            * Recalculate financial values
            * from the submitted receipt items.
            */
            $subtotal = collect($data['items'])->sum(
                fn ($item) =>
                    ($item['quantity_received']) *
                    ($item['unit_cost'] ?? 0)
            );

            /*
            * Get the current VAT rate.
            *
            * Since this is still a draft, the VAT rate can be
            * refreshed when the receipt is edited.
            */
            $vatPercentage = VatRate::currentPercentage();

            $vatAmount = round(
                $subtotal * ($vatPercentage / 100),
                2
            );

            $totalWithVat = round(
                $subtotal + $vatAmount,
                2
            );

            /*
            * Update receipt header + financial snapshot.
            */
            $receipt->update([
                'supplier_name'  => $data['supplier_name'],
                'invoice_number' => $data['invoice_number'] ?? null,
                'received_date'  => $data['received_date'],
                'notes'          => $data['notes'] ?? null,

                'subtotal'       => round($subtotal, 2),
                'vat_percentage' => $vatPercentage,
                'vat_amount'     => $vatAmount,
                'total_with_vat' => $totalWithVat,
            ]);

            /*
            * Replace receipt items.
            */
            $receipt->items()->delete();

            foreach ($data['items'] as $item) {

                $receipt->items()->create([
                    'item_id'           => $item['item_id'],
                    'quantity_received' => $item['quantity_received'],
                    'unit_cost'         => $item['unit_cost'] ?? null,
                    'remarks'           => $item['remarks'] ?? null,
                ]);
            }

            return $receipt->fresh([
                'items.item',
                'creator',
            ]);
        });
    }



    // Cancel a stock receipt (Draft)
    public function cancel(
        StockReceipt $receipt,
        string $reason
    ): StockReceipt {

        if (! $receipt->isDraft()) {
            abort(422, 'Only draft receipts can be cancelled.');
        }

        $receipt->update([
            'status' => 'CANCELLED',
            'cancelled_by' => auth()->id(),
            'cancelled_at' => now(),
            'cancellation_reason' => $reason,
        ]);

        return $receipt;
    }
}