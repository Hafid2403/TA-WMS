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
        Schema::create('goods_issues', function (Blueprint $table) {
            $table->id('gi_id');
            $table->string('gi_number', 50)->unique();
            $table->unsignedBigInteger('mr_id');
            $table->unsignedBigInteger('warehouse_id');
            $table->unsignedBigInteger('issued_by');
            $table->dateTime('issue_date');
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->foreign('mr_id')->references('mr_id')->on('material_requests')->onDelete('cascade');
            $table->foreign('warehouse_id')->references('warehouse_id')->on('warehouses')->onDelete('cascade');
            $table->foreign('issued_by')->references('id')->on('users')->onDelete('cascade');
        });

        Schema::create('goods_issue_items', function (Blueprint $table) {
            $table->id('gi_item_id');
            $table->unsignedBigInteger('gi_id');
            $table->unsignedBigInteger('product_id');
            $table->integer('qty_issued');
            $table->timestamps();

            $table->foreign('gi_id')->references('gi_id')->on('goods_issues')->onDelete('cascade');
            $table->foreign('product_id')->references('product_id')->on('products')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('goods_issue_items');
        Schema::dropIfExists('goods_issues');
    }
};
