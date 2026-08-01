<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('stock_request_actions', function (Blueprint $table) {
            $table->enum('stage', ['RECOMMENDATION', 'APPROVAL', 'ISSUANCE'])->change();
            $table->enum('action', [
                'RECOMMENDED', 'APPROVED', 'REJECTED', 'RETURNED', 'ADJUSTED',
                'ISSUED', 'PARTIALLY_ISSUED',
            ])->change();
        });
    }

    public function down(): void
    {
        Schema::table('stock_request_actions', function (Blueprint $table) {
            $table->enum('stage', ['RECOMMENDATION', 'APPROVAL'])->change();
            $table->enum('action', ['RECOMMENDED', 'APPROVED', 'REJECTED', 'RETURNED', 'ADJUSTED'])->change();
        });
    }
};
