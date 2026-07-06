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
        Schema::create('users', function (Blueprint $table) {
        $table->id();

        $table->string('username')->unique();
        $table->string('email')->nullable()->unique();

        $table->enum('account_type', [
            'STAFF',
            'INSTITUTION',
            'DS_OFFICE',
        ]);

        $table->enum('account_status', [
            'PENDING',
            'ACTIVE',
            'REJECTED',
            'SUSPENDED',
        ])->default('PENDING');

        $table->timestamp('email_verified_at')->nullable();

        $table->string('password');

        $table->foreignId('approved_by')
            ->nullable()
            ->constrained('users')
            ->nullOnDelete();

        $table->timestamp('approved_at')->nullable();

        $table->text('rejection_reason')->nullable();

        $table->rememberToken();
        $table->timestamps();
    });
}

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('users');
        Schema::dropIfExists('password_reset_tokens');
        Schema::dropIfExists('sessions');
    }
};
