<?php

// database/migrations/..._create_request_actions_table.php

// database/migrations/..._create_stock_request_actions_table.php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('stock_request_actions', function (Blueprint $table) {
            $table->id();

            $table->foreignId('stock_request_id')
                ->constrained('stock_requests')
                ->cascadeOnDelete();

            $table->enum('stage', [
                'RECOMMENDATION',
                'APPROVAL',
            ]);

            $table->foreignId('actor_id')
                ->constrained('users')
                ->restrictOnDelete();

            $table->enum('action', [
                'RECOMMENDED',
                'APPROVED',
                'REJECTED',
                'RETURNED',
                'ADJUSTED',
            ]);

            $table->text('remarks')->nullable();

            $table->timestamp('acted_at');

            $table->timestamps();

            $table->index(['stock_request_id', 'stage']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('stock_request_actions');
    }
};