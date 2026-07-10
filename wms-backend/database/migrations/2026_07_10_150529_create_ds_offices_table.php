<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('ds_offices', function (Blueprint $table) {
            $table->id();

            $table->string('name_en');
            $table->string('name_si');

            $table->string('code')->unique();

            $table->string('district');

            $table->boolean('is_active')
                ->default(true);

            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('ds_offices');
    }
};