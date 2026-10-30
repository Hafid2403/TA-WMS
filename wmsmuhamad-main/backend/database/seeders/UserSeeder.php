<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    /**
     * Run the user and role seeds.
     */
    public function run(): void
    {
        // Disable foreign key checks for a clean seed
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        // Truncate tables to prevent duplication
        DB::table('roles')->truncate();
        DB::table('users')->truncate();

        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = ON;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        }

        // 1. Seed Roles
        DB::table('roles')->insert([
            [
                'role_id' => 1,
                'role_name' => 'Master',
                'description' => 'System Manager with administrative privileges and approval controls.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 2,
                'role_name' => 'PIC',
                'description' => 'Warehouse operator responsible for inbound receipts, outbound picking, and inventory counting.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 3,
                'role_name' => 'QC',
                'description' => 'Quality Control inspector tasked with incoming product quality verification.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'role_id' => 4,
                'role_name' => 'Super Admin',
                'description' => 'Super Administrator with system-wide configuration and multi-warehouse control.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 2. Seed Users
        $password = Hash::make('password');

        $usersData = [
            [
                'id' => 1,
                'role_id' => 1, // Master
                'warehouse_id' => 1,
                'name' => 'Muhammad Hafid (Master)',
                'email' => 'master@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 2,
                'role_id' => 2, // PIC Jakarta
                'warehouse_id' => 1,
                'name' => 'Kasyfil Aziz (PIC)',
                'email' => 'pic@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 3,
                'role_id' => 3, // QC Jakarta
                'warehouse_id' => 1,
                'name' => 'Muhammad Habibi (QC)',
                'email' => 'qc@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 4,
                'role_id' => 1, // Master 2
                'warehouse_id' => 1,
                'name' => 'Hendra Wijaya (Master)',
                'email' => 'master2@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 5,
                'role_id' => 1, // Master 3
                'warehouse_id' => 2,
                'name' => 'Ronald Simanjuntak (Master)',
                'email' => 'master3@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 6,
                'role_id' => 2, // PIC Surabaya
                'warehouse_id' => 2,
                'name' => 'Agus Pratama (PIC Surabaya)',
                'email' => 'pic.surabaya@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 7,
                'role_id' => 2, // PIC Bandung
                'warehouse_id' => 3,
                'name' => 'Dewi Lestari (PIC Bandung)',
                'email' => 'pic.bandung@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 8,
                'role_id' => 2, // PIC Medan
                'warehouse_id' => 4,
                'name' => 'Rian Hidayat (PIC Medan)',
                'email' => 'pic.medan@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 9,
                'role_id' => 2, // PIC Makassar
                'warehouse_id' => 5,
                'name' => 'Andi Wijaya (PIC Makassar)',
                'email' => 'pic.makassar@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 10,
                'role_id' => 2, // PIC Semarang
                'warehouse_id' => 6,
                'name' => 'Bambang Susilo (PIC Semarang)',
                'email' => 'pic.semarang@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 11,
                'role_id' => 2, // PIC Yogyakarta
                'warehouse_id' => 7,
                'name' => 'Cici Amelia (PIC Yogyakarta)',
                'email' => 'pic.yogyakarta@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 12,
                'role_id' => 2, // PIC Bali
                'warehouse_id' => 8,
                'name' => 'Ketut Gede (PIC Bali)',
                'email' => 'pic.bali@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 13,
                'role_id' => 2, // PIC Balikpapan
                'warehouse_id' => 9,
                'name' => 'Antonius Putra (PIC Balikpapan)',
                'email' => 'pic.balikpapan@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 14,
                'role_id' => 2, // PIC Palembang
                'warehouse_id' => 10,
                'name' => 'Fitri Handayani (PIC Palembang)',
                'email' => 'pic.palembang@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 15,
                'role_id' => 2, // PIC Pekanbaru
                'warehouse_id' => 11,
                'name' => 'Heri Setiawan (PIC Pekanbaru)',
                'email' => 'pic.pekanbaru@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 16,
                'role_id' => 2, // PIC Pontianak
                'warehouse_id' => 12,
                'name' => 'Rudi Hartono (PIC Pontianak)',
                'email' => 'pic.pontianak@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 17,
                'role_id' => 3, // QC Surabaya
                'warehouse_id' => 2,
                'name' => 'Eko Prasetyo (QC Surabaya)',
                'email' => 'qc.surabaya@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 18,
                'role_id' => 3, // QC Bandung
                'warehouse_id' => 3,
                'name' => 'Fiona Indah (QC Bandung)',
                'email' => 'qc.bandung@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 19,
                'role_id' => 3, // QC Medan
                'warehouse_id' => 4,
                'name' => 'Gani Saputra (QC Medan)',
                'email' => 'qc.medan@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 20,
                'role_id' => 4, // Super Admin
                'warehouse_id' => null,
                'name' => 'Admin Super',
                'email' => 'admin@wms.com',
                'password' => $password,
                'is_active' => true,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 21,
                'role_id' => 2, // PIC
                'warehouse_id' => 1,
                'name' => 'Budi Santoso',
                'email' => 'budi@electra.co.id',
                'password' => $password,
                'is_active' => false,
                'status' => 'inactive',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 22,
                'role_id' => 1, // Master
                'warehouse_id' => 2,
                'name' => 'Citra Lestari',
                'email' => 'citra@electra.co.id',
                'password' => $password,
                'is_active' => false,
                'status' => 'inactive',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'id' => 23,
                'role_id' => 2, // PIC
                'warehouse_id' => 3,
                'name' => 'Deni Firmansyah',
                'email' => 'deni@electra.co.id',
                'password' => $password,
                'is_active' => false,
                'status' => 'inactive',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('users')->insert($usersData);
    }
}
