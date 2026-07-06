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
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('role_id')
                ->after('id')
                ->constrained()
                ->restrictOnDelete();

            $table->foreignId('division_id')
                ->nullable()
                ->after('role_id')
                ->constrained()
                ->restrictOnDelete();

            $table->string('employee_number')
                ->nullable()
                ->unique()
                ->after('division_id');

            $table->string('phone')
                ->nullable()
                ->after('email');

            $table->enum('account_status', [
                'PENDING',
                'ACTIVE',
                'REJECTED',
                'SUSPENDED',
            ])
                ->default('PENDING')
                ->after('password');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['role_id']);
            $table->dropForeign(['division_id']);

            $table->dropColumn([
                'role_id',
                'division_id',
                'employee_number',
                'phone',
                'account_status',
            ]);
        });
    }
};
