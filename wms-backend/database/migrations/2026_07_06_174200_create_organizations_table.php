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
        Schema::create('organizations', function (Blueprint $table) {
            $table->id();

            $table->foreignId('user_id')
                ->unique()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('division_id')
                ->constrained()
                ->restrictOnDelete();

            $table->enum('organization_kind', [
                'INSTITUTION',
                'DS_OFFICE',
            ]);

            $table->string('name');

            $table->foreignId('institution_type_id')
                ->nullable()
                ->constrained()
                ->nullOnDelete();

            $table->string('licence_number')
                ->nullable()
                ->unique();

            $table->text('address');

            $table->string('contact_number');

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('organizations');
    }
};
