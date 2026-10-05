<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('phone_verifications', function (Blueprint $table) {
            $table->id();
            $table->string('phone')->index();
            $table->string('otp_hash');
            $table->string('verification_token')->nullable()->unique();
            $table->timestamp('expires_at');
            $table->timestamp('verified_at')->nullable();
            $table->timestamp('token_used_at')->nullable();
            $table->unsignedTinyInteger('attempts')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('phone_verifications');
    }
};