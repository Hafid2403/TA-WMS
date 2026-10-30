<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('goods_receipts', function (Blueprint $table) {
            $table->id('gr_id');
            $table->string('gr_number', 50)->unique();
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('vendor_id');
            $table->unsignedBigInteger('received_by');
            $table->datetime('receipt_date');
            $table->enum('receipt_type', ['good_receipt', 'pending_order'])->default('good_receipt');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('warehouse_id')->references('warehouse_id')->on('warehouses')->onDelete('cascade');
            $table->foreign('vendor_id')->references('vendor_id')->on('vendors')->onDelete('cascade');
            $table->foreign('received_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipts');
    }
};
