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
        Schema::create('material_request_items', function (Blueprint $table) {
            $table->id('mr_item_id');
            $table->unsignedBigInteger('mr_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('qty_requested');
            $table->integer('qty_fulfilled')->default(0);
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('mr_id')->references('mr_id')->on('material_requests')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('material_request_items');
    }
};
