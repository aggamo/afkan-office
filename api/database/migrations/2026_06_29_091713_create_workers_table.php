<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('workers', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->string('internal_number')->unique();

            $table->string('full_name_ar');
            $table->string('full_name_en');
            $table->string('full_name_am');
            $table->date('date_of_birth');
            $table->enum('gender', ['male', 'female']);
            $table->string('passport_number')->unique();
            $table->date('passport_expiry');
            $table->foreignId('nationality_id')->constrained('countries');
            $table->foreignId('worker_type_id')->constrained('worker_types');

            $table->unsignedInteger('experience_years')->default(0);
            $table->decimal('height_cm', 5, 1)->nullable();
            $table->decimal('weight_kg', 5, 1)->nullable();
            $table->enum('religion', ['muslim', 'christian', 'other'])->nullable();
            $table->enum('marital_status', ['single', 'married', 'divorced', 'widowed'])->nullable();
            $table->unsignedInteger('number_of_children')->default(0);

            $table->enum('reservation_status', ['available', 'reserved_customer', 'reserved_agency', 'hired', 'unavailable'])
                ->default('available');
            $table->decimal('readiness_score', 5, 2)->default(0);

            $table->foreignId('agency_id')->nullable()->constrained('agencies')->nullOnDelete();
            $table->foreignId('current_recruitment_stage_id')->nullable()->constrained('recruitment_stages')->nullOnDelete();

            $table->boolean('is_published')->default(false);
            $table->boolean('is_active')->default(true);

            $table->timestamps();
            $table->softDeletes();

            $table->index(['reservation_status', 'is_published', 'is_active']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('workers');
    }
};
