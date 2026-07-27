<?php

// database/migrations/..._create_request_items_table.php

// database/migrations/..._create_stock_request_items_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_request_items', function (Blueprint $table) {
            $table->id();

            $table->foreignId('stock_request_id')
                ->constrained('stock_requests')
                ->cascadeOnDelete();

            $table->foreignId('item_id')
                ->constrained('items')
                ->restrictOnDelete();

            $table->decimal('quantity_requested', 15, 3);
            $table->decimal('quantity_recommended', 15, 3)->nullable();
            $table->decimal('quantity_approved', 15, 3)->nullable();
            $table->decimal('quantity_issued', 15, 3)->nullable();

            $table->text('remarks')->nullable();

            $table->timestamps();

            $table->index(['stock_request_id', 'item_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_request_items');
    }
};