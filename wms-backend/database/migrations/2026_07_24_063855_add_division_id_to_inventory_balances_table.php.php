<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('inventory_balances', function (Blueprint $table) {
            $table->foreignId('division_id')
                ->nullable()
                ->after('item_id')
                ->constrained()
                ->restrictOnDelete();
        });

        // Backfill existing rows using each item's own division_id,
        // since that's the only signal we have for pre-existing data.
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('UPDATE inventory_balances SET division_id = (SELECT items.division_id FROM items WHERE items.id = inventory_balances.item_id) WHERE division_id IS NULL');
        } else {
            DB::statement('
                UPDATE inventory_balances ib
                JOIN items i ON i.id = ib.item_id
                SET ib.division_id = i.division_id
                WHERE ib.division_id IS NULL
            ');
        }

        Schema::table('inventory_balances', function (Blueprint $table) {
            $table->foreignId('division_id')->nullable(false)->change();

            // item_id alone can no longer be unique — same item conceptually
            // shouldn't exist in two divisions if items are division-owned,
            // but this constraint protects against duplicate rows regardless.
            $table->unique(['item_id', 'division_id']);
        });
    }

    public function down(): void
    {
        Schema::table('inventory_balances', function (Blueprint $table) {
            $table->dropUnique(['item_id', 'division_id']);
            $table->dropConstrainedForeignId('division_id');
        });
    }
};
