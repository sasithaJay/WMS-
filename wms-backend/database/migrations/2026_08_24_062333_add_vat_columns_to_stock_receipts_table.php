<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('stock_receipts', function (Blueprint $table) {
            $table->decimal('vat_percentage', 5, 2)
                ->default(0)
                ->after('notes');

            $table->decimal('vat_amount', 15, 2)
                ->default(0)
                ->after('vat_percentage');

            $table->decimal('total_with_vat', 15, 2)
                ->default(0)
                ->after('vat_amount');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('stock_receipts', function (Blueprint $table) {
            $table->dropColumn([
                'vat_percentage',
                'vat_amount',
                'total_with_vat',
            ]);
        });
    }
};