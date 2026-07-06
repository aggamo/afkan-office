<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('roles', function (Blueprint $table) {
            $table->id();
            $table->string('slug')->unique(); // visitor, customer, agency, employee, super_admin
            $table->string('name_ar');
            $table->string('name_en');
            $table->string('name_am');
            $table->json('permissions')->nullable();
            $table->timestamps();
        });

        DB::table('roles')->insert([
            ['slug' => 'customer', 'name_ar' => 'عميل فردي', 'name_en' => 'Individual Customer', 'name_am' => 'የግል ደንበኛ', 'permissions' => json_encode([]), 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'agency', 'name_ar' => 'مكتب توظيف سعودي', 'name_en' => 'Saudi Agency', 'name_am' => 'የሳዑዲ ኤጀንሲ', 'permissions' => json_encode([]), 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'employee', 'name_ar' => 'موظف', 'name_en' => 'Employee', 'name_am' => 'ሰራተኛ', 'permissions' => json_encode([]), 'created_at' => now(), 'updated_at' => now()],
            ['slug' => 'super_admin', 'name_ar' => 'مدير عام', 'name_en' => 'Super Admin', 'name_am' => 'ዋና አስተዳዳሪ', 'permissions' => json_encode(['*']), 'created_at' => now(), 'updated_at' => now()],
        ]);
    }

    public function down(): void
    {
        Schema::dropIfExists('roles');
    }
};
