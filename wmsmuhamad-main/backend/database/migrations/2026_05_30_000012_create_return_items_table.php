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
        Schema::create('return_items', function (Blueprint $table) {
            $table->id('return_id');
            $table->unsignedBigInteger('gr_item_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('vendor_id');
            $table->integer('qty_returned');
            $table->text('reason')->nullable();
            $table->date('return_date');
            $table->unsignedBigInteger('returned_by');
            $table->enum('status', ['pending', 'sent', 'acknowledged'])->default('pending');
            $table->timestamps();

            $table->foreign('gr_item_id')->references('gr_item_id')->on('goods_receipt_items')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
            $table->foreign('vendor_id')->references('vendor_id')->on('vendors')->onDelete('cascade');
            $table->foreign('returned_by')->references('id')->on('users')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('return_items');
    }
};
