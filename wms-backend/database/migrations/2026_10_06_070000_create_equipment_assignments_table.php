<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('equipment_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('item_id')->constrained('items')->restrictOnDelete();
            $table->foreignId('stock_request_item_id')->nullable()->constrained('stock_request_items')->nullOnDelete();
            $table->foreignId('assigned_to')->constrained('users')->restrictOnDelete();
            $table->foreignId('issued_by')->constrained('users')->restrictOnDelete();
            $table->timestamp('issued_at');
            $table->enum('status', ['ASSIGNED', 'RETURN_REQUIRED', 'RETURN_PENDING', 'RETURNED'])->default('ASSIGNED');
            $table->text('return_reason')->nullable();
            $table->timestamp('return_requested_at')->nullable();
            $table->foreignId('returned_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('returned_at')->nullable();
            $table->enum('return_condition', ['GOOD', 'DAMAGED', 'MALFUNCTIONED', 'BEYOND_REPAIR'])->nullable();
            $table->text('return_remarks')->nullable();
            $table->timestamps();

            $table->index(['assigned_to', 'status']);
            $table->index(['item_id', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('equipment_assignments');
    }
};