<?php

namespace App\Policies;

use App\Models\StockReceipt;
use App\Models\User;

class StockReceiptPolicy
{
    /**
     * View list of receipts
     */
    public function viewAny(User $user): bool
    {
        return $user->staffProfile !== null;
    }


    /**
     * View a single receipt
     */
    public function view(
        User $user,
        StockReceipt $stockReceipt
    ): bool {

        return $this->sameDivision(
            $user,
            $stockReceipt
        );
    }


    /**
     * Create receipt
     */
    public function create(User $user): bool
    {
        return $user->staffProfile !== null
            && $user->isStoreKeeper();
    }


    /**
     * Update draft receipt
     */
    public function update(
        User $user,
        StockReceipt $stockReceipt
    ): bool {

        return $this->sameDivision(
                $user,
                $stockReceipt
            )
            && $stockReceipt->isDraft();
    }


    /**
     * Confirm receipt
     */
    public function confirm(
        User $user,
        StockReceipt $stockReceipt
    ): bool {

        return $this->sameDivision(
                $user,
                $stockReceipt
            )
            && $stockReceipt->isDraft()
            && $user->isStoreKeeper();
    }


    /**
     * Cancel receipt
     */
    public function cancel(
        User $user,
        StockReceipt $stockReceipt
    ): bool {

        return $this->sameDivision(
                $user,
                $stockReceipt
            )
            && $stockReceipt->isDraft();
    }


    private function sameDivision(
        User $user,
        StockReceipt $receipt
    ): bool {

        return $user->staffProfile?->division_id
            === $receipt->division_id;
    }
}