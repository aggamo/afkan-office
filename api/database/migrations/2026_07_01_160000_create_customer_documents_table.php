<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

/**
 * Customer-uploaded documents (Document 7): passport copy, national ID,
 * family information and additional files. Stored privately and served only
 * through a brokered, ownership-checked download route.
 */
return new class extends Migration
{
    public function up(): void
    {
        Schema::create('customer_documents', function (Blueprint $table) {
            $table->id();
            $table->uuid('uuid')->unique();
            $table->foreignId('customer_id')->constrained('customers')->cascadeOnDelete();
            $table->enum('category', ['passport', 'national_id', 'family', 'other'])->default('other');
            $table->string('original_name');
            $table->string('file_path');
            $table->string('file_hash')->nullable();
            $table->string('mime_type', 100)->nullable();
            $table->unsignedBigInteger('size')->default(0);
            $table->enum('status', ['pending', 'verified', 'rejected'])->default('pending');
            $table->foreignId('uploaded_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
            $table->softDeletes();

            $table->index(['customer_id', 'category']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('customer_documents');
    }
};
