<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Recruitment Workflow & Smart Tracking (Document 8).
 *
 * - Extends recruitment_stages with workflow metadata: core-stage protection,
 *   public visibility, timeline colour, and an SLA (expected days) used for
 *   progress, Smart ETA and delay detection.
 * - Adds a permanent tracking number and warranty window to workers.
 * - Adds an immutable stage-history table recording every transition.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recruitment_stages', function (Blueprint $table) {
            $table->boolean('is_core')->default(false)->after('step_number');
            $table->boolean('is_public')->default(true)->after('is_core');
            $table->string('color', 20)->nullable()->after('is_public');
            $table->unsignedInteger('sla_days')->nullable()->after('color');
        });

        Schema::table('workers', function (Blueprint $table) {
            $table->string('tracking_number')->nullable()->unique()->after('internal_number');
            $table->timestamp('warranty_started_at')->nullable();
            $table->timestamp('warranty_ends_at')->nullable();
        });

        Schema::create('worker_stage_history', function (Blueprint $table) {
            $table->id();
            $table->foreignId('worker_id')->constrained('workers')->cascadeOnDelete();
            $table->foreignId('from_stage_id')->nullable()->constrained('recruitment_stages')->nullOnDelete();
            $table->foreignId('to_stage_id')->nullable()->constrained('recruitment_stages')->nullOnDelete();
            $table->foreignId('changed_by')->nullable()->constrained('users')->nullOnDelete();
            $table->text('notes')->nullable();
            $table->timestamp('entered_at');
            $table->timestamps();

            $table->index(['worker_id', 'entered_at']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('worker_stage_history');

        Schema::table('workers', function (Blueprint $table) {
            $table->dropUnique(['tracking_number']);
            $table->dropColumn(['tracking_number', 'warranty_started_at', 'warranty_ends_at']);
        });

        Schema::table('recruitment_stages', function (Blueprint $table) {
            $table->dropColumn(['is_core', 'is_public', 'color', 'sla_days']);
        });
    }
};
