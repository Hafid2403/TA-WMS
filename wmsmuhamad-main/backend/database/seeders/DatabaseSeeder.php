<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Disable foreign key checks for a clean seed
        if (DB::getDriverName() === 'sqlite') {
            DB::statement('PRAGMA foreign_keys = OFF;');
        } else {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        }

        // Truncate all tables
        DB::table('roles')->truncate();
        DB::table('warehouses')->truncate();
        DB::table('users')->truncate();
        DB::table('product_categories')->truncate();
        DB::table('products')->truncate();
        DB::table('vendors')->truncate();
        DB::table('vendor_products')->truncate();
        DB::table('departments')->truncate();
        DB::table('stock')->truncate();
        DB::table('purchase_orders')->truncate();
        DB::table('purchase_order_items')->truncate();
        DB::table('goods_receipts')->truncate();
        DB::table('goods_receipt_items')->truncate();
        DB::table('return_items')->truncate();
        DB::table('putaways')->truncate();
        DB::table('material_requests')->truncate();
        DB::table('material_request_items')->truncate();
        DB::table('goods_issues')->truncate();
        DB::table('goods_issue_items')->truncate();
        DB::table('stock_opnames')->truncate();
        DB::table('stock_opname_items')->truncate();
        DB::table('stock_adjustments')->truncate();
        DB::table('stock_movements')->truncate();
        DB::table('activity_logs')->truncate();
        DB::table('warehouse_signatures')->truncate();

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

        // 2. Seed Warehouses
        DB::table('warehouses')->insert([
            [
                'warehouse_id' => 1,
                'warehouse_name' => 'Main Warehouse Jakarta',
                'address' => 'Kawasan Industri Pulogadung Blok J No. 12',
                'city' => 'Jakarta Timur',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 25000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 2,
                'warehouse_name' => 'Surabaya Branch Warehouse',
                'address' => 'Margomulyo Indah Kavling 10-11',
                'city' => 'Surabaya',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 15000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 3,
                'warehouse_name' => 'Bandung Logistics Hub',
                'address' => 'Jl. Soekarno-Hatta No. 450',
                'city' => 'Bandung',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 20000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 4,
                'warehouse_name' => 'Medan Distribution Center',
                'address' => 'Kawasan Industri Medan (KIM) Tahap II',
                'city' => 'Medan',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 10000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 5,
                'warehouse_name' => 'Makassar Port Warehouse',
                'address' => 'Jl. Nusantara Pelabuhan No. 89',
                'city' => 'Makassar',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 5000,
                'status' => 'maintenance',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 6,
                'warehouse_name' => 'Semarang Central Warehouse',
                'address' => 'Jl. Yos Sudarso Kavling 12-14',
                'city' => 'Semarang',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 10000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 7,
                'warehouse_name' => 'Yogyakarta Transit Depot',
                'address' => 'Jl. Ringroad Utara No. 78',
                'city' => 'Yogyakarta',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 10000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 8,
                'warehouse_name' => 'Bali Branch Warehouse',
                'address' => 'Jl. Bypass Ngurah Rai No. 200',
                'city' => 'Denpasar',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 10000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 9,
                'warehouse_name' => 'Balikpapan Storage Facility',
                'address' => 'Jl. Mulawarman RT 23 No. 45',
                'city' => 'Balikpapan',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 10000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 10,
                'warehouse_name' => 'Palembang Cargo Hub',
                'address' => 'Jl. Letjen Harun Sohar No. 102',
                'city' => 'Palembang',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 10000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 11,
                'warehouse_name' => 'Pekanbaru Distribution Center',
                'address' => 'Jl. Soekarno-Hatta KM 9',
                'city' => 'Pekanbaru',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 10000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'warehouse_id' => 12,
                'warehouse_name' => 'Pontianak Local Warehouse',
                'address' => 'Jl. Ahmad Yani II Blok C No. 5',
                'city' => 'Pontianak',
                'pic_id' => null,
                'is_active' => true,
                'capacity' => 10000,
                'status' => 'active',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 3. Call UserSeeder to populate roles and users
        $this->call(UserSeeder::class);

        // Update Warehouse PIC References
        $picMappings = [1 => 2, 2 => 6, 3 => 7, 4 => 8, 5 => 9, 6 => 10, 7 => 11, 8 => 12, 9 => 13, 10 => 14, 11 => 15, 12 => 16];
        foreach ($picMappings as $whId => $picId) {
            DB::table('warehouses')->where('warehouse_id', $whId)->update(['pic_id' => $picId]);
        }

        // 4. Seed Product Categories
        DB::table('product_categories')->insert([
            [
                'category_id' => 1,
                'category_name' => 'Electronics',
                'description' => 'Electronic components, microcontrollers, and panels.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => 2,
                'category_name' => 'Raw Materials',
                'description' => 'Raw industrial materials, wires, and sheets.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'category_id' => 3,
                'category_name' => 'Packaging',
                'description' => 'Cartons, wrapping paper, bubble wraps, and boxing.',
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ]);

        // 5. Seed Products (25 Products)
        $productsData = [
            [
                'product_id' => 1,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-001',
                'product_name' => 'LED Panel 24 Inch',
                'unit' => 'pcs',
                'description' => 'Full HD widescreen IPS monitor panel replacement.',
                'min_stock' => 10,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 2,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-002',
                'product_name' => 'Microcontroller Board',
                'unit' => 'pcs',
                'description' => 'Programmable SoC micro development kit with Wi-Fi module.',
                'min_stock' => 25,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 3,
                'category_id' => 2, // Raw Materials
                'internal_code' => 'PRD-RAW-001',
                'product_name' => 'Copper Wire 100m',
                'unit' => 'roll',
                'description' => 'Solid copper conductor wiring with heat-proof PVC shielding.',
                'min_stock' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 4,
                'category_id' => 3, // Packaging
                'internal_code' => 'PRD-PKG-001',
                'product_name' => 'Corrugated Carton Box',
                'unit' => 'pcs',
                'description' => 'Double-walled heavy duty cardboard storage box.',
                'min_stock' => 100,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 5,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-003',
                'product_name' => 'LCD Display 16x2',
                'unit' => 'pcs',
                'description' => 'Alphanumeric character LCD screen with yellow-green backlight.',
                'min_stock' => 50,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 6,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-004',
                'product_name' => 'Power Supply 12V 5A',
                'unit' => 'pcs',
                'description' => 'Regulated switching power supply adapter for LED and industrial uses.',
                'min_stock' => 15,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 7,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-005',
                'product_name' => 'Stepper Motor Nema 17',
                'unit' => 'pcs',
                'description' => 'Bipolar stepper motor with 1.8 degree step angle for 3D printers and CNC.',
                'min_stock' => 20,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 8,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-006',
                'product_name' => 'Temperature Sensor Probe',
                'unit' => 'pcs',
                'description' => 'Waterproof DS18B20 digital thermal sensor probe.',
                'min_stock' => 30,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 9,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-007',
                'product_name' => 'HDMI Cable 1.5m',
                'unit' => 'pcs',
                'description' => 'High speed HDMI 2.0 cable with gold plated connectors.',
                'min_stock' => 40,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 10,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-008',
                'product_name' => 'Relays Module 4-Channel',
                'unit' => 'pcs',
                'description' => '5V optocoupler isolated relay shield board for Arduino and Raspberry Pi.',
                'min_stock' => 25,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 11,
                'category_id' => 1, // Electronics
                'internal_code' => 'PRD-ELE-009',
                'product_name' => 'Capacitor 1000uF 25V',
                'unit' => 'pcs',
                'description' => 'Radial electrolytic filter capacitor.',
                'min_stock' => 500,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 12,
                'category_id' => 2, // Raw Materials
                'internal_code' => 'PRD-RAW-002',
                'product_name' => 'Aluminum Sheet 2x1m',
                'unit' => 'sheet',
                'description' => '1.5mm thick industrial grade aluminum sheet panel.',
                'min_stock' => 10,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 13,
                'category_id' => 2, // Raw Materials
                'internal_code' => 'PRD-RAW-003',
                'product_name' => 'Steel Rod 10mm x 6m',
                'unit' => 'pcs',
                'description' => 'Reinforcing steel structural bar for framing.',
                'min_stock' => 15,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 14,
                'category_id' => 2, // Raw Materials
                'internal_code' => 'PRD-RAW-004',
                'product_name' => 'Solder Wire 100g Roll',
                'unit' => 'roll',
                'description' => '60/40 lead-tin alloy solder wire with rosin flux core.',
                'min_stock' => 30,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 15,
                'category_id' => 2, // Raw Materials
                'internal_code' => 'PRD-RAW-005',
                'product_name' => 'PVC Tube 1 Inch x 4m',
                'unit' => 'pcs',
                'description' => 'Class D impact-resistant PVC electrical conduit piping.',
                'min_stock' => 50,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 16,
                'category_id' => 2, // Raw Materials
                'internal_code' => 'PRD-RAW-006',
                'product_name' => 'Carbon Fiber Plate',
                'unit' => 'pcs',
                'description' => 'High strength lightweight composite material sheet (200x300mm).',
                'min_stock' => 5,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 17,
                'category_id' => 2, // Raw Materials
                'internal_code' => 'PRD-RAW-007',
                'product_name' => 'Brass Connector Fitting',
                'unit' => 'pcs',
                'description' => 'Male threaded brass terminal connectors.',
                'min_stock' => 100,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 18,
                'category_id' => 2, // Raw Materials
                'internal_code' => 'PRD-RAW-008',
                'product_name' => 'Resin Epoxy 1kg Kit',
                'unit' => 'kit',
                'description' => 'Two-part clear casting epoxy resin and hardener kit.',
                'min_stock' => 10,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 19,
                'category_id' => 3, // Packaging
                'internal_code' => 'PRD-PKG-002',
                'product_name' => 'Bubble Wrap Roll 50m',
                'unit' => 'roll',
                'description' => 'Shockproof polyethylene bubble wrap cushioning sheet.',
                'min_stock' => 8,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 20,
                'category_id' => 3, // Packaging
                'internal_code' => 'PRD-PKG-003',
                'product_name' => 'Stretch Film Roll 500m',
                'unit' => 'roll',
                'description' => 'Industrial grade pallet wrapping stretch film.',
                'min_stock' => 12,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 21,
                'category_id' => 3, // Packaging
                'internal_code' => 'PRD-PKG-004',
                'product_name' => 'Adhesive Tape Heavy Duty',
                'unit' => 'pcs',
                'description' => 'Strong brown packing tape for carton box sealing.',
                'min_stock' => 60,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 22,
                'category_id' => 3, // Packaging
                'internal_code' => 'PRD-PKG-005',
                'product_name' => 'Wooden Pallet 1x1.2m',
                'unit' => 'pcs',
                'description' => 'Heavy load capacity standard pine wood warehouse pallet.',
                'min_stock' => 20,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 23,
                'category_id' => 3, // Packaging
                'internal_code' => 'PRD-PKG-006',
                'product_name' => 'Plastic Zip Bag 10x15cm',
                'unit' => 'pack',
                'description' => 'Self-sealing clear plastic bag for screws and small components.',
                'min_stock' => 50,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 24,
                'category_id' => 3, // Packaging
                'internal_code' => 'PRD-PKG-007',
                'product_name' => 'Silica Gel Desiccant Packs',
                'unit' => 'pack',
                'description' => 'Moisture absorbing silica gel sachets for electronic packaging.',
                'min_stock' => 100,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'product_id' => 25,
                'category_id' => 3, // Packaging
                'internal_code' => 'PRD-PKG-008',
                'product_name' => 'Cardboard Corner Protector',
                'unit' => 'pcs',
                'description' => 'Rigid cardboard L-bars for edge protection during shipping.',
                'min_stock' => 200,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
        ];

        DB::table('products')->insert($productsData);

        // 6. Seed Vendors (15 Vendors)
        $vendorsData = [
            [
                'vendor_id' => 1,
                'vendor_name' => 'Global Electronics Corp',
                'contact_person' => 'John Doe',
                'phone' => '08123456789',
                'email' => 'sales@globalelectronics.com',
                'address' => '77 Industrial Avenue, Building 4, Tech City',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 2,
                'vendor_name' => 'Indo Metal Industries',
                'contact_person' => 'Budi Santoso',
                'phone' => '08234567890',
                'email' => 'info@indometal.co.id',
                'address' => 'Jl. Metalurgi Raya No. 45, Kawasan Industri Gresik',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 3,
                'vendor_name' => 'Jakarta Packaging Solutions',
                'contact_person' => 'Diana Putri',
                'phone' => '08139876543',
                'email' => 'order@jakartapackaging.com',
                'address' => 'Kawasan Industri MM2100 Blok C-5, Cikarang',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 4,
                'vendor_name' => 'Tekno Sensor Indonesia',
                'contact_person' => 'Rian Hidayat',
                'phone' => '08213456789',
                'email' => 'support@teknosensor.co.id',
                'address' => 'Ruko Margonda Center Blok B No. 12, Depok',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 5,
                'vendor_name' => 'Prima Logam Nusantara',
                'contact_person' => 'Agus Hermawan',
                'phone' => '08381234567',
                'email' => 'sales@primalogam.com',
                'address' => 'Jl. Lodan Raya No. 23, Ancol, Jakarta Utara',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 6,
                'vendor_name' => 'Delta Silicon Supplier',
                'contact_person' => 'Willy Setiawan',
                'phone' => '08127654321',
                'email' => 'willy@deltasilicon.com',
                'address' => 'Lippo Cikarang Industrial Estate Kavling 88',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 7,
                'vendor_name' => 'Sumber Kabel Abadi',
                'contact_person' => 'Susanti',
                'phone' => '08523456789',
                'email' => 'susanti@sumberkabel.com',
                'address' => 'Kawasan Industri Terboyo Blok F No. 10, Semarang',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 8,
                'vendor_name' => 'Plastik Jaya Mandiri',
                'contact_person' => 'Herman',
                'phone' => '08182345678',
                'email' => 'herman@plastikjaya.com',
                'address' => 'Jl. Raya Perancis Kavling 8, Tangerang',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 9,
                'vendor_name' => 'Sentosa Palletindo',
                'contact_person' => 'Gerry',
                'phone' => '08781234567',
                'email' => 'gerry@sentosapallet.com',
                'address' => 'Jl. Raya Narogong KM 12.5, Bekasi',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 10,
                'vendor_name' => 'Electra Component Asia',
                'contact_person' => 'Michael Chen',
                'phone' => '08112345678',
                'email' => 'sales@electracomponent.asia',
                'address' => 'Changi South Street 2, Singapore',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 11,
                'vendor_name' => 'Borneo Timber Supplier',
                'contact_person' => 'Hasan',
                'phone' => '08531234567',
                'email' => 'hasan@borneotimber.com',
                'address' => 'Jl. Pelabuhan Trisakti No. 12, Banjarmasin',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 12,
                'vendor_name' => 'Sumatran Wire & Cable',
                'contact_person' => 'Rahmat',
                'phone' => '08221234567',
                'email' => 'rahmat@sumatranwire.com',
                'address' => 'Kawasan Industri Tanjung Morawa, Deli Serdang',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 13,
                'vendor_name' => 'Cahaya Glass & Acrylic',
                'contact_person' => 'Linda',
                'phone' => '08129876541',
                'email' => 'linda@cahayaglass.co.id',
                'address' => 'Jl. Daan Mogot KM 14 No. 20, Jakarta Barat',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 14,
                'vendor_name' => 'Java Packaging Center',
                'contact_person' => 'Evelyn',
                'phone' => '08779876543',
                'email' => 'evelyn@javapackaging.com',
                'address' => 'Rungkut Industri III No. 44, Surabaya',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ],
            [
                'vendor_id' => 15,
                'vendor_name' => 'Nusantara Metalindo',
                'contact_person' => 'Ferry',
                'phone' => '08123456711',
                'email' => 'ferry@nusantarative.com',
                'address' => 'Kawasan Industri Jababeka Tahap I, Cikarang',
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ]
        ];

        DB::table('vendors')->insert($vendorsData);

        // 7. Seed Vendor Product Mappings (for 25 Products mapped to various Vendors)
        $vpData = [];
        $vpIndex = 1;
        // Global Electronics Corp (Vendor 1) owns product 1, 2, 5, 6, 7, 8, 9, 10, 11
        $v1Prods = [1, 2, 5, 6, 7, 8, 9, 10, 11];
        foreach ($v1Prods as $pId) {
            $vpData[] = [
                'vendor_product_id' => $vpIndex++,
                'vendor_id' => 1,
                'product_id' => $pId,
                'vendor_product_code' => 'VND-ELE-G' . str_pad($pId, 3, '0', STR_PAD_LEFT),
                'vendor_product_name' => 'Global Elec Prod ' . $pId,
                'unit_price' => 10000.00 * $pId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Indo Metal Industries (Vendor 2) owns 3, 12, 13, 14, 15, 16, 17, 18
        $v2Prods = [3, 12, 13, 14, 15, 16, 17, 18];
        foreach ($v2Prods as $pId) {
            $vpData[] = [
                'vendor_product_id' => $vpIndex++,
                'vendor_id' => 2,
                'product_id' => $pId,
                'vendor_product_code' => 'VND-MET-I' . str_pad($pId, 3, '0', STR_PAD_LEFT),
                'vendor_product_name' => 'Indo Metal Prod ' . $pId,
                'unit_price' => 12000.00 * $pId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        // Jakarta Packaging Solutions (Vendor 3) owns 4, 19, 20, 21, 22, 23, 24, 25
        $v3Prods = [4, 19, 20, 21, 22, 23, 24, 25];
        foreach ($v3Prods as $pId) {
            $vpData[] = [
                'vendor_product_id' => $vpIndex++,
                'vendor_id' => 3,
                'product_id' => $pId,
                'vendor_product_code' => 'VND-PKG-J' . str_pad($pId, 3, '0', STR_PAD_LEFT),
                'vendor_product_name' => 'Jkt Pack Prod ' . $pId,
                'unit_price' => 5000.00 * $pId,
                'is_active' => true,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        DB::table('vendor_products')->insert($vpData);

        // 8. Seed Departments (12 Departments)
        DB::table('departments')->insert([
            ['department_id' => 1, 'department_name' => 'Production', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 2, 'department_name' => 'Research and Development', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 3, 'department_name' => 'Quality Assurance', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 4, 'department_name' => 'Maintenance and Engineering', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 5, 'department_name' => 'Procurement & Supply Chain', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 6, 'department_name' => 'Logistics & Dispatch', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 7, 'department_name' => 'Assembly Line Alpha', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 8, 'department_name' => 'Assembly Line Beta', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 9, 'department_name' => 'Custom Prototyping', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 10, 'department_name' => 'Warehouse Operations', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 11, 'department_name' => 'Tooling & Moulding', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
            ['department_id' => 12, 'department_name' => 'Packaging & Labeling', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()],
        ]);

        // 9. Seed Stock Levels (For all 25 Products in Warehouse 1 and 2)
        $stocks = [];
        $stockIndex = 1;
        for ($p = 1; $p <= 25; $p++) {
            // Warehouse 1 Jakarta
            $stocks[] = [
                'stock_id' => $stockIndex++,
                'warehouse_id' => 1,
                'product_id' => $p,
                'qty_available' => 100 + ($p * 5),
                'qty_reserved' => 5,
                'zone' => chr(65 + ($p % 4)), // A, B, C, D
                'rack' => str_pad(($p % 5) + 1, 2, '0', STR_PAD_LEFT),
                'bin' => 'C' . (($p % 3) + 1),
                'created_at' => now(),
                'updated_at' => now(),
            ];
            // Warehouse 2 Surabaya
            $stocks[] = [
                'stock_id' => $stockIndex++,
                'warehouse_id' => 2,
                'product_id' => $p,
                'qty_available' => 50 + ($p * 3),
                'qty_reserved' => 0,
                'zone' => chr(69 + ($p % 3)), // E, F, G
                'rack' => str_pad(($p % 4) + 1, 2, '0', STR_PAD_LEFT),
                'bin' => 'B' . (($p % 2) + 1),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('stock')->insert($stocks);

        // 10. Seed Purchase Orders (25 POs)
        $poData = [];
        for ($i = 1; $i <= 25; $i++) {
            $poData[] = [
                'po_id' => $i,
                'po_number' => 'PO-2026' . str_pad($i + 500, 4, '0', STR_PAD_LEFT),
                'vendor_id' => ($i % 3) + 1, // 1, 2, 3
                'po_date' => now()->subDays(30 - $i),
                'status' => 'completed',
                'notes' => 'Bulk restock procurement index ' . $i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('purchase_orders')->insert($poData);

        // 11. Seed Goods Receipts (25 GRs to test pagination)
        $grData = [];
        for ($i = 1; $i <= 25; $i++) {
            $grData[] = [
                'gr_id' => $i,
                'gr_number' => 'GR-2026' . str_pad($i + 800, 4, '0', STR_PAD_LEFT),
                'po_id' => $i,
                'warehouse_id' => ($i % 2) + 1, // alternate wh 1 and wh 2
                'vendor_id' => ($i % 3) + 1,
                'received_by' => ($i % 2 === 0) ? 2 : 6, // PIC Jakarta or PIC Surabaya
                'receipt_date' => now()->subDays(28 - $i),
                'receipt_type' => 'good_receipt',
                'notes' => 'Received shipment matching PO index ' . $i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('goods_receipts')->insert($grData);

        // Goods Receipt Items
        $grItems = [];
        $grItemIndex = 1;
        for ($i = 1; $i <= 25; $i++) {
            // Let's add 2 items per Goods Receipt
            $p1 = (($i * 2) % 25) + 1;
            $p2 = (($i * 2 + 1) % 25) + 1;

            $grItems[] = [
                'gr_item_id' => $grItemIndex++,
                'gr_id' => $i,
                'vendor_product_id' => $p1,
                'product_id' => $p1,
                'qty_received' => 50,
                'qty_accepted' => 48,
                'qty_rejected' => 2,
                'qc_status' => 'partial',
                'qc_checklist' => json_encode(['physical_check' => true]),
                'qc_photo' => null,
                'qc_by' => 3,
                'qc_date' => now()->subDays(28 - $i)->addHours(2),
                'qc_notes' => '2 items rejected due to surface scratches.',
                'created_at' => now(),
                'updated_at' => now(),
            ];

            $grItems[] = [
                'gr_item_id' => $grItemIndex++,
                'gr_id' => $i,
                'vendor_product_id' => $p2,
                'product_id' => $p2,
                'qty_received' => 100,
                'qty_accepted' => 100,
                'qty_rejected' => 0,
                'qc_status' => 'passed',
                'qc_checklist' => json_encode(['physical_check' => true]),
                'qc_photo' => null,
                'qc_by' => 3,
                'qc_date' => now()->subDays(28 - $i)->addHours(2),
                'qc_notes' => 'All items passed quality verification.',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('goods_receipt_items')->insert($grItems);

        // 12. Seed Return Items (15 Returns)
        $returnItems = [];
        for ($i = 1; $i <= 15; $i++) {
            $returnItems[] = [
                'return_id' => $i,
                'gr_item_id' => ($i * 2) - 1, // maps to partial items
                'product_id' => ((($i * 2) - 1) % 25) + 1,
                'vendor_id' => ($i % 3) + 1,
                'qty_returned' => 2,
                'reason' => 'Defect/Scratch found during QC check index ' . $i,
                'return_date' => now()->subDays(27 - $i)->toDateString(),
                'returned_by' => 2,
                'status' => 'sent',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('return_items')->insert($returnItems);

        // 13. Seed Putaways (20 Putaway Placement Logs)
        $putaways = [];
        for ($i = 1; $i <= 20; $i++) {
            $putaways[] = [
                'putaway_id' => $i,
                'gr_item_id' => $i * 2, // maps to passed items
                'product_id' => (($i * 2) % 25) + 1,
                'warehouse_id' => ($i % 2) + 1,
                'qty_placed' => 100,
                'zone' => chr(65 + ($i % 4)),
                'rack' => str_pad(($i % 5) + 1, 2, '0', STR_PAD_LEFT),
                'bin' => 'C' . (($i % 3) + 1),
                'placed_by' => ($i % 2 === 0) ? 2 : 6,
                'placed_date' => now()->subDays(25 - $i),
                'status' => 'completed',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('putaways')->insert($putaways);

        // 14. Seed Material Requests (18 MRs)
        $mrData = [];
        for ($i = 1; $i <= 18; $i++) {
            $mrData[] = [
                'mr_id' => $i,
                'mr_number' => 'MR-2026' . str_pad($i + 900, 4, '0', STR_PAD_LEFT),
                'warehouse_id' => ($i % 2) + 1,
                'department_id' => ($i % 12) + 1,
                'requested_by' => 'Staff ' . $i,
                'request_date' => now()->subDays(20 - $i),
                'status' => ($i % 3 === 0) ? 'pending' : 'completed',
                'approved_by' => ($i % 3 === 0) ? null : 1,
                'approved_date' => ($i % 3 === 0) ? null : now()->subDays(20 - $i)->addHours(1),
                'notes' => 'Materials requested for department project ' . $i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('material_requests')->insert($mrData);

        // Material Request Items
        $mrItems = [];
        $mrItemIndex = 1;
        for ($i = 1; $i <= 18; $i++) {
            $p = ($i % 25) + 1;
            $mrItems[] = [
                'mr_item_id' => $mrItemIndex++,
                'mr_id' => $i,
                'product_id' => $p,
                'qty_requested' => 10,
                'qty_fulfilled' => ($i % 3 === 0) ? 0 : 10,
                'notes' => 'MR item requirement ' . $i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('material_request_items')->insert($mrItems);

        // 15. Seed Goods Issues (12 Issues)
        $giData = [];
        $giIndex = 1;
        for ($i = 1; $i <= 18; $i++) {
            if ($i % 3 !== 0) { // only for completed MRs
                $giData[] = [
                    'gi_id' => $giIndex,
                    'gi_number' => 'GI-2026' . str_pad($giIndex + 950, 4, '0', STR_PAD_LEFT),
                    'mr_id' => $i,
                    'warehouse_id' => ($i % 2) + 1,
                    'issued_by' => ($i % 2 === 0) ? 2 : 6,
                    'issue_date' => now()->subDays(20 - $i)->addHours(2),
                    'notes' => 'Goods issue completed for MR index ' . $i,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
                $giIndex++;
            }
        }
        DB::table('goods_issues')->insert($giData);

        // Goods Issue Items
        $giItems = [];
        $giItemIndex = 1;
        for ($gi = 1; $gi < $giIndex; $gi++) {
            $p = ($gi % 25) + 1;
            $giItems[] = [
                'gi_item_id' => $giItemIndex++,
                'gi_id' => $gi,
                'product_id' => $p,
                'qty_issued' => 10,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('goods_issue_items')->insert($giItems);

        // 16. Seed Stock Opnames (15 Sessions)
        $opnameData = [];
        for ($i = 1; $i <= 15; $i++) {
            $opnameData[] = [
                'opname_id' => $i,
                'warehouse_id' => ($i % 2) + 1,
                'conducted_by' => ($i % 2 === 0) ? 2 : 6,
                'approved_by' => ($i % 3 === 0) ? null : 1,
                'start_date' => now()->subDays(16 - $i),
                'end_date' => ($i % 3 === 0) ? null : now()->subDays(16 - $i)->addHours(2),
                'status' => ($i % 3 === 0) ? 'completed' : 'approved',
                'notes' => 'Monthly inventory audit session ' . $i,
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('stock_opnames')->insert($opnameData);

        // Stock Opname Items
        $opnameItems = [];
        $opnameItemIndex = 1;
        for ($i = 1; $i <= 15; $i++) {
            $p = ($i % 25) + 1;
            $opnameItems[] = [
                'opname_item_id' => $opnameItemIndex++,
                'opname_id' => $i,
                'product_id' => $p,
                'system_qty' => 100,
                'physical_qty' => ($i % 4 === 0) ? 95 : 100,
                'discrepancy' => ($i % 4 === 0) ? -5 : 0,
                'notes' => ($i % 4 === 0) ? '5 units damage mismatch.' : 'Count match.',
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }
        DB::table('stock_opname_items')->insert($opnameItems);

        // 17. Seed Stock Adjustments (for mismatched audit sessions)
        $adjustments = [];
        $adjIndex = 1;
        for ($i = 1; $i <= 15; $i++) {
            if ($i % 3 !== 0 && $i % 4 === 0) { // approved & mismatch
                $p = ($i % 25) + 1;
                $adjustments[] = [
                    'adjustment_id' => $adjIndex++,
                    'opname_id' => $i,
                    'product_id' => $p,
                    'warehouse_id' => ($i % 2) + 1,
                    'qty_before' => 100,
                    'qty_after' => 95,
                    'adjusted_by' => 1,
                    'adjustment_date' => now()->subDays(16 - $i)->addHours(2),
                    'reason' => 'Discrepancy adjustment for audit ' . $i,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }
        }
        DB::table('stock_adjustments')->insert($adjustments);

        // 18. Seed Warehouse Signatures
        for ($w = 1; $w <= 12; $w++) {
            $picName = ($w === 1) ? 'Kasyfil Aziz' : 'Staff PIC ' . $w;
            DB::table('warehouse_signatures')->insert([
                [
                    'warehouse_id' => $w,
                    'document_type' => 'goods_receipt',
                    'columns' => json_encode([
                        [
                            'label' => 'Diterima Oleh',
                            'role' => 'receiver',
                            'name' => $picName,
                            'title' => 'PIC Penerima'
                        ],
                        [
                            'label' => 'Disetujui Oleh',
                            'role' => 'approver',
                            'name' => 'Muhammad Hafid',
                            'title' => 'Kepala Gudang'
                        ]
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'warehouse_id' => $w,
                    'document_type' => 'stock_opname',
                    'columns' => json_encode([
                        [
                            'label' => 'Dihitung Oleh',
                            'role' => 'receiver',
                            'name' => $picName,
                            'title' => 'PIC Stock Opname'
                        ],
                        [
                            'label' => 'Disetujui Oleh',
                            'role' => 'approver',
                            'name' => 'Muhammad Hafid',
                            'title' => 'Kepala Gudang'
                        ]
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'warehouse_id' => $w,
                    'document_type' => 'material_request',
                    'columns' => json_encode([
                        [
                            'label' => 'Diminta Oleh',
                            'role' => 'receiver',
                            'name' => 'Staff Peminta',
                            'title' => 'Supervisor'
                        ],
                        [
                            'label' => 'Disetujui Oleh',
                            'role' => 'approver',
                            'name' => 'Muhammad Hafid',
                            'title' => 'Kepala Gudang'
                        ]
                    ]),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]
            ]);
        }
    }
}
