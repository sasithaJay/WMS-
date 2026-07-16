<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_receipts', function (Blueprint $table) {
            $table->id();

            $table->foreignId('division_id')
                ->constrained('divisions')
                ->restrictOnDelete();

            $table->string('grn_number')->unique();

            $table->string('supplier_name');

            $table->string('invoice_number')
                ->nullable();

            $table->date('received_date');

            $table->text('notes')
                ->nullable();

            $table->enum('status', [
                'DRAFT',
                'CONFIRMED',
                'CANCELLED',
            ])->default('DRAFT');

            $table->foreignId('created_by')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('confirmed_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('confirmed_at')
                ->nullable();

            $table->foreignId('cancelled_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('cancelled_at')
                ->nullable();

            $table->text('cancellation_reason')
                ->nullable();

            $table->timestamps();

            $table->index([
                'division_id',
                'status',
            ]);

            $table->index('received_date');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_receipts');
    }
};