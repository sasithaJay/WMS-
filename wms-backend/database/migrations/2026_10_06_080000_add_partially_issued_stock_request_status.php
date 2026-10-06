<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        DB::statement("ALTER TABLE stock_requests MODIFY status ENUM('PENDING_RECOMMENDATION','PENDING_APPROVAL','PARTIALLY_PROCESSED','PARTIALLY_ISSUED','APPROVED','REJECTED','RETURNED','ISSUED','CANCELLED') NOT NULL DEFAULT 'PENDING_RECOMMENDATION'");
    }

    public function down(): void
    {
        DB::statement("ALTER TABLE stock_requests MODIFY status ENUM('PENDING_RECOMMENDATION','PENDING_APPROVAL','PARTIALLY_PROCESSED','APPROVED','REJECTED','RETURNED','ISSUED','CANCELLED') NOT NULL DEFAULT 'PENDING_RECOMMENDATION'");
    }
};