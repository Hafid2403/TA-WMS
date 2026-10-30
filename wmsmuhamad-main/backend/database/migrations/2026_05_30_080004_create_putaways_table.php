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
        Schema::create('putaways', function (Blueprint $table) {
            $table->id('putaway_id');
            $table->unsignedBigInteger('gr_item_id');
            $table->unsignedBigInteger('product_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->integer('qty_placed');
            $table->string('zone', 10);
            $table->string('rack', 10);
            $table->string('bin', 10);
            $table->unsignedBigInteger('placed_by')->nullable();
            $table->dateTime('placed_date');
            $table->enum('status', ['pending', 'completed'])->default('pending');
            $table->timestamps();

            $table->foreign('gr_item_id')->references('gr_item_id')->on('goods_receipt_items')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
            $table->foreign('warehouse_id')->references('warehouse_id')->on('warehouses')->onDelete('cascade');
            $table->foreign('placed_by')->references('id')->on('users')->onDelete('set null');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('putaways');
    }
};
