<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // For MySQL, we can alter the ENUM column to add 'rejected'
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE stock_opnames MODIFY COLUMN status ENUM('draft', 'in_progress', 'completed', 'approved', 'rejected') NOT NULL DEFAULT 'draft'");
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (DB::getDriverName() !== 'sqlite') {
            DB::statement("ALTER TABLE stock_opnames MODIFY COLUMN status ENUM('draft', 'in_progress', 'completed', 'approved') NOT NULL DEFAULT 'draft'");
        }
    }
};
