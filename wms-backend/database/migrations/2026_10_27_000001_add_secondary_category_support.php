<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('item_categories', function (Blueprint $table) {
            $table->foreignId('parent_category_id')
                ->nullable()
                ->after('id')
                ->constrained('item_categories')
                ->restrictOnDelete();
            $table->string('description', 500)->nullable()->after('name_si');
            $table->string('normalized_name', 100)->nullable()->after('name_en');
        });

        DB::table('item_categories')->orderBy('id')->get(['id', 'name_en'])->each(function ($category) {
            $normalized = mb_strtolower(preg_replace('/\s+/u', ' ', trim($category->name_en)) ?? trim($category->name_en));
            DB::table('item_categories')->where('id', $category->id)->update(['normalized_name' => $normalized]);
        });

        Schema::table('item_categories', function (Blueprint $table) {
            $table->unique(['parent_category_id', 'normalized_name'], 'item_categories_parent_normalized_unique');
        });
    }

    public function down(): void
    {
        Schema::table('item_categories', function (Blueprint $table) {
            $table->dropUnique('item_categories_parent_normalized_unique');
            $table->dropConstrainedForeignId('parent_category_id');
            $table->dropColumn(['description', 'normalized_name']);
        });
    }
};
