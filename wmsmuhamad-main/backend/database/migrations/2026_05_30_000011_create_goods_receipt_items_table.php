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
        Schema::create('goods_receipt_items', function (Blueprint $table) {
            $table->id('gr_item_id');
            $table->unsignedBigInteger('gr_id');
            $table->unsignedBigInteger('vendor_product_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('qty_received');
            $table->integer('qty_accepted')->default(0);
            $table->integer('qty_rejected')->default(0);
            $table->enum('qc_status', ['pending', 'passed', 'partial', 'rejected'])->default('pending');
            $table->unsignedBigInteger('qc_by')->nullable();
            $table->datetime('qc_date')->nullable();
            $table->text('qc_notes')->nullable();
            $table->timestamps();

            $table->foreign('gr_id')->references('gr_id')->on('goods_receipts')->onDelete('cascade');
            $table->foreign('vendor_product_id')->references('vendor_product_id')->on('vendor_products')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
            $table->foreign('qc_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_receipt_items');
    }
};
