<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->renameColumn(
                'name',
                'name_en'
            );

            $table->string('name_si')
                ->nullable()
                ->after('name_en');
        });
    }

    public function down(): void
    {
        Schema::table('roles', function (Blueprint $table) {
            $table->dropColumn('name_si');

            $table->renameColumn(
                'name_en',
                'name'
            );
        });
    }
};