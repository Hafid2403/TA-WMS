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
        Schema::create('stock_opname_items', function (Blueprint $table) {
            $table->id('opname_item_id');
            $table->unsignedBigInteger('opname_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('system_qty');
            $table->integer('physical_qty');
            $table->integer('discrepancy');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('opname_id')->references('opname_id')->on('stock_opnames')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('stock_opname_items');
    }
};
