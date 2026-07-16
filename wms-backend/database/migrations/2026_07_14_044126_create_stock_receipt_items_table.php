<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_receipt_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('stock_receipt_id')
                ->constrained('stock_receipts')
                ->cascadeOnDelete();

            $table->foreignId('item_id')
                ->constrained('items')
                ->restrictOnDelete();

            $table->decimal('quantity_received', 15, 3);

            $table->decimal('unit_cost', 15, 2)
                ->nullable();

            $table->text('remarks')
                ->nullable();

            $table->timestamps();

            $table->unique([
                'stock_receipt_id',
                'item_id',
            ]);

            $table->index('item_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_receipt_items');
    }
};