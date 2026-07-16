<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id();

            $table->foreignId('division_id')
                ->constrained('divisions')
                ->restrictOnDelete();

            $table->foreignId('item_id')
                ->constrained('items')
                ->restrictOnDelete();

            $table->enum('movement_type', [
                'RECEIPT',
                'ISSUE',
                'RETURN',
                'ADJUSTMENT_IN',
                'ADJUSTMENT_OUT',
            ]);

            /*
             * Positive values increase stock.
             * Negative values decrease stock.
             */
            $table->decimal('quantity', 15, 3);

            $table->decimal('balance_before', 15, 3);

            $table->decimal('balance_after', 15, 3);

            /*
             * Examples:
             * STOCK_RECEIPT
             * GOODS_ISSUE
             * RETURN
             * STOCK_ADJUSTMENT
             */
            $table->string('reference_type')
                ->nullable();

            /*
             * ID of the related stock receipt,
             * issue, return or adjustment.
             */
            $table->unsignedBigInteger('reference_id')
                ->nullable();

            /*
             * Human-readable reference:
             * GRN-2026-000001
             * ISSUE-2026-000001
             */
            $table->string('reference_number')
                ->nullable();

            $table->foreignId('performed_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->text('remarks')
                ->nullable();

            $table->timestamps();

            $table->index([
                'division_id',
                'item_id',
            ]);

            $table->index([
                'movement_type',
                'created_at',
            ]);

            $table->index([
                'reference_type',
                'reference_id',
            ]);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_movements');
    }
};