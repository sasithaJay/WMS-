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
        Schema::create('recommendation_rules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('requester_role_id')
                ->nullable()
                ->constrained('roles')
                ->cascadeOnDelete();

            $table->enum('organization_kind', ['INSTITUTION', 'DS_OFFICE'])
                ->nullable();

             $table->enum('request_context', ['PERSONAL', 'SECTION_COMMON'])
                ->nullable();

            $table->foreignId('recommender_role_id')
                ->nullable()
                ->constrained('roles')
                ->cascadeOnDelete();

            $table->unsignedInteger('priority')->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('recommendation_rules');
    }
};
