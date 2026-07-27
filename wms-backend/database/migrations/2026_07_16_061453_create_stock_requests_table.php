<?php
// database/migrations/..._create_stock_requests_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_requests', function (Blueprint $table) {
            $table->id();

            $table->string('request_number')->unique();
            // e.g. REQ-2026-000001

            $table->foreignId('requester_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->foreignId('division_id')
                ->constrained('divisions')
                ->restrictOnDelete();

            $table->foreignId('store_id')
                ->constrained('stores')
                ->restrictOnDelete();

            $table->foreignId('section_id')
                ->nullable()
                ->constrained('sections')
                ->restrictOnDelete();

            $table->foreignId('organization_id')
                ->nullable()
                ->constrained('organizations')
                ->restrictOnDelete();

            $table->enum('request_context', [
                'PERSONAL',
                'SECTION_COMMON',
                'INSTITUTION',
                'DS_OFFICE',
            ]);

            $table->enum('status', [
                'PENDING_RECOMMENDATION',
                'PENDING_APPROVAL',
                'APPROVED',
                'REJECTED',
                'RETURNED',
                'ISSUED',
                'CANCELLED',
            ])->default('PENDING_RECOMMENDATION');

            $table->enum('current_stage', [
                'RECOMMENDATION',
                'APPROVAL',
                'ISSUANCE',
            ])->nullable();

            $table->foreignId('recommender_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->foreignId('approver_id')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('notes')->nullable();

            $table->timestamp('submitted_at')->nullable();

            $table->timestamps();

            $table->index(['requester_id', 'status']);
            $table->index(['division_id', 'status']);
            $table->index(['status', 'current_stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_requests');
    }
};