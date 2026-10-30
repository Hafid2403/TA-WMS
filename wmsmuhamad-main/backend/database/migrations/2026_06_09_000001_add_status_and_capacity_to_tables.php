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
        Schema::table('warehouses', function (Blueprint $table) {
            $table->integer('capacity')->default(10000)->after('city');
            $table->string('status', 50)->default('active')->after('capacity'); // active, maintenance, inactive
        });

        Schema::table('users', function (Blueprint $table) {
            $table->string('status', 50)->default('active')->after('is_active'); // active, pending, inactive
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('warehouses', function (Blueprint $table) {
            $table->dropColumn(['capacity', 'status']);
        });

        Schema::table('users', function (Blueprint $table) {
            $table->dropColumn(['status']);
        });
    }
};
