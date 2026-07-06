<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('workers', function (Blueprint $table) {
            $table->decimal('price', 10, 2)->nullable()->after('readiness_score');
            $table->string('price_currency', 3)->default('SAR')->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('workers', function (Blueprint $table) {
            $table->dropColumn(['price', 'price_currency']);
        });
    }
};
