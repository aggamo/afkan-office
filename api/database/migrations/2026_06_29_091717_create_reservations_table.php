<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('worker_id')->constrained('workers');
            $table->enum('reserved_by_type', ['customer', 'agency']);
            $table->foreignId('customer_id')->nullable()->constrained('customers')->nullOnDelete();
            $table->foreignId('agency_id')->nullable()->constrained('agencies')->nullOnDelete();
            $table->foreignId('converted_from_reservation_id')->nullable()->constrained('reservations')->nullOnDelete();

            $table->enum('status', ['active', 'converted', 'expired', 'cancelled', 'completed'])->default('active');
            $table->timestamp('reserved_at');
            $table->timestamp('expires_at');
            $table->timestamp('resolved_at')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();

            $table->index(['worker_id', 'status']);
            $table->index('expires_at');
        });

        // Enforce: a worker can have only one ACTIVE reservation at a time.
        // Partial unique index (supported by SQLite and Postgres). On MySQL this
        // constraint is additionally enforced at the application/service layer.
        if (in_array(DB::connection()->getDriverName(), ['sqlite', 'pgsql'])) {
            DB::statement(
                'CREATE UNIQUE INDEX uq_workers_single_active_reservation '
                . "ON reservations (worker_id) WHERE status = 'active'"
            );
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
