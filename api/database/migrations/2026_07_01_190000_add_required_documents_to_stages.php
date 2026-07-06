<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Per-stage document requirements (Document 8): each stage may declare document
 * type slugs that should be on file; the workflow surfaces missing ones.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::table('recruitment_stages', function (Blueprint $table) {
            $table->json('required_document_slugs')->nullable()->after('sla_days');
        });
    }

    public function down(): void
    {
        Schema::table('recruitment_stages', function (Blueprint $table) {
            $table->dropColumn('required_document_slugs');
        });
    }
};
