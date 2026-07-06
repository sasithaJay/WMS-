<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('section_id')
                ->nullable()
                ->after('division_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('nic_number')
                ->unique()
                ->after('employee_number');

            $table->string('username')
                ->unique()
                ->after('name');
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['section_id']);

            $table->dropColumn([
                'section_id',
                'nic_number',
                'username',
            ]);
        });
    }
};