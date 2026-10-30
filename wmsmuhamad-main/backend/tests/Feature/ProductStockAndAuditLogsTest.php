<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\Product;
use App\Models\ProductCategory;
use App\Models\Warehouse;
use App\Models\ActivityLog;
use App\Models\Stock;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProductStockAndAuditLogsTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test creating a product with custom initial quantities.
     */
    public function test_create_product_with_initial_quantities(): void
    {
        $master = User::where('email', 'master@wms.com')->first();
        $this->assertNotNull($master);

        $category = ProductCategory::first();
        $warehouse1 = Warehouse::first();
        $warehouse2 = Warehouse::skip(1)->first() ?? Warehouse::first();

        $payload = [
            'product_name' => 'Test Product Qty Input',
            'internal_code' => 'TEST-QTY-001',
            'category_id' => $category->category_id,
            'unit' => 'pcs',
            'min_stock' => 10,
            'warehouse_ids' => [$warehouse1->warehouse_id, $warehouse2->warehouse_id],
            'warehouse_stocks' => [
                $warehouse1->warehouse_id => 50,
                $warehouse2->warehouse_id => 120
            ],
            'is_active' => true
        ];

        $response = $this->actingAs($master)->postJson('/api/master/products', $payload);
        $response->assertStatus(201);

        $productId = $response->json('data.product_id');

        // Assert stock levels
        $this->assertDatabaseHas('stock', [
            'product_id' => $productId,
            'warehouse_id' => $warehouse1->warehouse_id,
            'qty_available' => 50
        ]);

        $this->assertDatabaseHas('stock', [
            'product_id' => $productId,
            'warehouse_id' => $warehouse2->warehouse_id,
            'qty_available' => 120
        ]);
    }

    /**
     * Test updating a product with custom stock quantities.
     */
    public function test_update_product_with_quantities(): void
    {
        $master = User::where('email', 'master@wms.com')->first();
        $this->assertNotNull($master);

        $product = Product::first();
        $warehouse1 = Warehouse::first();

        // Initialize stock first
        Stock::updateOrCreate(
            ['warehouse_id' => $warehouse1->warehouse_id, 'product_id' => $product->product_id],
            ['qty_available' => 10, 'qty_reserved' => 0]
        );

        $payload = [
            'product_name' => $product->product_name . ' Updated',
            'internal_code' => $product->internal_code,
            'category_id' => $product->category_id,
            'unit' => $product->unit,
            'min_stock' => $product->min_stock,
            'warehouse_ids' => [$warehouse1->warehouse_id],
            'warehouse_stocks' => [
                $warehouse1->warehouse_id => 85
            ],
            'is_active' => true
        ];

        $response = $this->actingAs($master)->putJson("/api/master/products/{$product->product_id}", $payload);
        $response->assertStatus(200);

        // Assert updated stock level
        $this->assertDatabaseHas('stock', [
            'product_id' => $product->product_id,
            'warehouse_id' => $warehouse1->warehouse_id,
            'qty_available' => 85
        ]);
    }

    /**
     * Test superadmin audit logs search query and activity_type fallback.
     */
    public function test_superadmin_audit_logs_endpoints(): void
    {
        $superadmin = User::whereHas('role', function ($q) {
            $q->where('role_name', 'Super Admin');
        })->first();
        $this->assertNotNull($superadmin);

        // Create a dummy activity log
        $log = ActivityLog::create([
            'user_id' => $superadmin->id,
            'action' => 'Create Product Test',
            'description' => 'Tested the database logger integration',
            'ip_address' => '127.0.0.1',
            'user_agent' => 'PHPUnit'
        ]);

        // Get audit logs
        $response = $this->actingAs($superadmin)->getJson('/api/superadmin/audit-logs');
        $response->assertStatus(200);
        $response->assertJsonFragment([
            'action' => 'Create Product Test',
            'activity_type' => 'Create Product Test' // Virtual attribute should be appended
        ]);

        // Test search filter
        $responseWithSearch = $this->actingAs($superadmin)->getJson('/api/superadmin/audit-logs?search=Create Product Test');
        $responseWithSearch->assertStatus(200);
        $this->assertNotEmpty($responseWithSearch->json('data'));
    }
}
