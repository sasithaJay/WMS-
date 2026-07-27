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
        Schema::create('approval_rules', function (Blueprint $table) {
            $table->id();

            $table->foreignId('division_id')
                ->nullable()
                ->constrained()
                ->cascadeOnDelete();

            $table->foreignId('requester_role_id')
                ->nullable()
                ->constrained('roles')
                ->cascadeOnDelete();

            $table->enum('organization_kind', ['INSTITUTION', 'DS_OFFICE'])
                ->nullable();

            $table->enum('request_context', ['PERSONAL', 'SECTION_COMMON'])
                ->nullable();

            $table->foreignId('approver_role_id')
                ->nullable()
                ->constrained('roles')
                ->cascadeOnDelete();

            // multiple rows with the same match = "any one of these can approve"
            // NULL approver_role_id = auto-approved / no approval needed (Commissioner's own requests)
            $table->unsignedInteger('priority')
                ->default(0);

            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('approval_rules');
    }
};
