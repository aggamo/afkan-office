<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Adds the customer → agency authorization workflow (Document 7).
 * After a customer reserves a worker (24h) they must authorize exactly one
 * approved Saudi agency; that agency then accepts (converting the hold to a
 * 72h agency reservation) or rejects (freeing the customer to choose another).
 *
 * NOTE: on SQLite, adding a column with an ALTER-time foreign key forces a full
 * table rebuild, and that rebuild reconstructs the partial unique index
 * (uq_workers_single_active_reservation) as a plain unique index — silently
 * dropping its "WHERE status = 'active'" clause and breaking the conversion
 * flow. We therefore add the column without an ALTER-time FK and (re)create the
 * partial index explicitly at the end.
 */
return new class extends Migration
{
    public function up(): void
    {
        $driver = DB::connection()->getDriverName();

        Schema::table('reservations', function (Blueprint $table) {
            $table->unsignedBigInteger('authorized_agency_id')->nullable()->after('agency_id');
            $table->enum('authorization_status', ['none', 'pending', 'accepted', 'rejected'])
                ->default('none')->after('status');
            $table->timestamp('authorized_at')->nullable()->after('reserved_at');

            $table->index(['authorized_agency_id', 'authorization_status']);
        });

        // Add the real foreign key only on drivers that support ALTER ADD FK
        // without a table rebuild (MySQL/Postgres). On SQLite the reference is
        // enforced at the application layer.
        if (in_array($driver, ['mysql', 'mariadb', 'pgsql'], true)) {
            Schema::table('reservations', function (Blueprint $table) {
                $table->foreign('authorized_agency_id')->references('id')->on('agencies')->nullOnDelete();
            });
        }

        // Guarantee the "one ACTIVE reservation per worker" partial unique index
        // is present and correct (recreated here in case an earlier table
        // rebuild stripped its WHERE clause).
        if (in_array($driver, ['sqlite', 'pgsql'], true)) {
            DB::statement('DROP INDEX IF EXISTS uq_workers_single_active_reservation');
            DB::statement(
                'CREATE UNIQUE INDEX uq_workers_single_active_reservation '
                . "ON reservations (worker_id) WHERE status = 'active'"
            );
        }
    }

    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropIndex(['authorized_agency_id', 'authorization_status']);
            $table->dropColumn(['authorized_agency_id', 'authorization_status', 'authorized_at']);
        });
    }
};
