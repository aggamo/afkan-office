<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('worker_languages', function (Blueprint $table) {
            $table->id();
            $table->foreignId('worker_id')->constrained('workers')->cascadeOnDelete();
            $table->foreignId('language_id')->constrained('languages')->cascadeOnDelete();
            $table->enum('proficiency', ['basic', 'intermediate', 'fluent', 'native'])->default('basic');
            $table->timestamps();
            $table->unique(['worker_id', 'language_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_languages');
    }
};
