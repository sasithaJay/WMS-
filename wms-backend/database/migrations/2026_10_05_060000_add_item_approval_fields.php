<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_request_items', function (Blueprint $table) {
            $table->enum('approval_status', ['pending', 'approved', 'rejected'])
                ->default('pending')
                ->after('quantity_issued');
            $table->text('approval_remarks')->nullable()->after('approval_status');
            $table->text('rejection_reason')->nullable()->after('approval_remarks');
            $table->foreignId('approved_by')->nullable()->after('rejection_reason')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('approved_at')->nullable()->after('approved_by');
            $table->foreignId('rejected_by')->nullable()->after('approved_at')
                ->constrained('users')->nullOnDelete();
            $table->timestamp('rejected_at')->nullable()->after('rejected_by');
            $table->index(['stock_request_id', 'approval_status']);
        });

        // Existing rows with an approved quantity already carry an approval decision.
        DB::table('stock_request_items')
            ->whereNotNull('quantity_approved')
            ->update(['approval_status' => 'approved']);

        // Existing deployments use a MySQL enum for the parent status.
        DB::statement("ALTER TABLE stock_requests MODIFY status ENUM('PENDING_RECOMMENDATION','PENDING_APPROVAL','PARTIALLY_PROCESSED','PARTIALLY_ISSUED','APPROVED','REJECTED','RETURNED','ISSUED','CANCELLED') NOT NULL DEFAULT 'PENDING_RECOMMENDATION'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE stock_requests MODIFY status ENUM('PENDING_RECOMMENDATION','PENDING_APPROVAL','APPROVED','REJECTED','RETURNED','ISSUED','CANCELLED') NOT NULL DEFAULT 'PENDING_RECOMMENDATION'");

        Schema::table('stock_request_items', function (Blueprint $table) {
            $table->dropForeign(['approved_by']);
            $table->dropForeign(['rejected_by']);
            $table->dropIndex(['stock_request_id', 'approval_status']);
            $table->dropColumn([
                'approval_status',
                'approval_remarks',
                'rejection_reason',
                'approved_by',
                'approved_at',
                'rejected_by',
                'rejected_at',
            ]);
        });
    }
};