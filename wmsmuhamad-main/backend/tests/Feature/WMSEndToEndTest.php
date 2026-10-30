<?php

namespace Tests\Feature;

use App\Models\User;
use App\Models\PurchaseOrder;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\MaterialRequest;
use App\Models\Stock;
use App\Models\StockOpname;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WMSEndToEndTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        // Seed the entire default database with roles, products, vendors, etc.
        $this->seed();
    }

    /**
     * Test the entire WMS workflow: PO -> Receipt -> QC -> Putaway -> MR -> Approve -> Issue -> Opname
     */
    public function test_complete_wms_workflow(): void
    {
        // 1. Resolve Users from seeded DB
        $master = User::where('email', 'master@wms.com')->first();
        $pic = User::where('email', 'pic@wms.com')->first();
        $qc = User::where('email', 'qc@wms.com')->first();

        $this->assertNotNull($master);
        $this->assertNotNull($pic);
        $this->assertNotNull($qc);

        // Clear seeded starting stocks so we start from zero and track clean transitions
        \Illuminate\Support\Facades\DB::table('stock')->delete();

        // --- PHASE 1: PO Creation ---
        // QC should be forbidden from creating POs
        $response = $this->actingAs($qc)->postJson('/api/purchase-orders', [
            'vendor_id' => 1,
            'po_date' => date('Y-m-d'),
            'notes' => 'Forbidden test',
            'items' => [
                ['product_id' => 1, 'qty_ordered' => 100]
            ]
        ]);
        $response->assertStatus(403);

        // Master drafts a Purchase Order
        $response = $this->actingAs($master)->postJson('/api/purchase-orders', [
            'vendor_id' => 1,
            'po_date' => date('Y-m-d'),
            'notes' => 'Test PO end-to-end',
            'items' => [
                ['product_id' => 1, 'qty_ordered' => 100],
                ['product_id' => 5, 'qty_ordered' => 50]
            ]
        ]);
        $response->assertStatus(201);
        $poId = $response->json('data.po_id');
        $this->assertDatabaseHas('purchase_orders', ['po_id' => $poId, 'status' => 'ordered']);

        // --- PHASE 2: PO Inbound Receipt ---
        // PIC receives the PO items partially (e.g. 80 units of Product 1, 50 units of Product 5)
        $response = $this->actingAs($pic)->postJson("/api/purchase-orders/{$poId}/receive", [
            'warehouse_id' => 1,
            'receipt_date' => date('Y-m-d'),
            'receipt_type' => 'good_receipt',
            'notes' => 'Partial receipt',
            'items' => [
                [
                    'vendor_product_id' => 1, // product_id 1
                    'qty_received' => 80,
                ],
                [
                    'vendor_product_id' => 3, // product_id 5
                    'qty_received' => 50,
                ]
            ]
        ]);
        $response->assertStatus(201);
        $grId = $response->json('data.gr_id');

        // Check PO status transitioned to partial
        $this->assertDatabaseHas('purchase_orders', ['po_id' => $poId, 'status' => 'partial']);
        $this->assertDatabaseHas('goods_receipts', ['gr_id' => $grId, 'po_id' => $poId]);

        // --- PHASE 3: QC Inspection ---
        // PIC should be forbidden from doing QC inspection
        $response = $this->actingAs($pic)->postJson("/api/goods-receipt/{$grId}/qc", [
            'items' => [
                [
                    'gr_item_id' => 1,
                    'qty_accepted' => 80,
                    'qty_rejected' => 0,
                    'qc_notes' => 'Forbidden attempt'
                ]
            ]
        ]);
        $response->assertStatus(403);

        // Fetch GR Items to get their exact primary key ids
        $grItems = GoodsReceiptItem::where('gr_id', $grId)->get();
        $item1 = $grItems->where('product_id', 1)->first();
        $item2 = $grItems->where('product_id', 5)->first();

        // QC records inspection:
        // Product 1: 75 accepted, 5 rejected
        // Product 5: 50 accepted, 0 rejected
        $response = $this->actingAs($qc)->postJson("/api/goods-receipt/{$grId}/qc", [
            'items' => [
                [
                    'gr_item_id' => $item1->gr_item_id,
                    'qty_accepted' => 75,
                    'qty_rejected' => 5,
                    'qc_notes' => '5 items broken packaging'
                ],
                [
                    'gr_item_id' => $item2->gr_item_id,
                    'qty_accepted' => 50,
                    'qty_rejected' => 0,
                    'qc_notes' => 'All perfect'
                ]
            ]
        ]);
        $response->assertStatus(200);

        // Verify stock has been incremented at the 'Default' location
        $this->assertDatabaseHas('stock', [
            'product_id' => 1,
            'qty_available' => 75,
            'zone' => 'Default'
        ]);

        // Verify return record was logged for the 5 rejected items
        $this->assertDatabaseHas('return_items', [
            'product_id' => 1,
            'qty_returned' => 5
        ]);

        // Verify physical stock movements logged
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => 1,
            'movement_type' => 'INBOUND',
            'qty_change' => 75
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => 1,
            'movement_type' => 'RETURN',
            'qty_change' => -5
        ]);

        // --- PHASE 4: Putaway Shelving ---
        // PIC places 75 accepted units of Product 1 into Shelf Zone A, Rack 01, Bin C3
        $response = $this->actingAs($pic)->postJson('/api/putaway', [
            'gr_item_id' => $item1->gr_item_id,
            'zone' => 'A',
            'rack' => '01',
            'bin' => 'C3',
            'qty_placed' => 75,
            'placed_date' => date('Y-m-d')
        ]);
        $response->assertStatus(201);

        // Verify stock shifted: single unique stock record coordinates updated to Shelf target A
        $this->assertDatabaseHas('stock', [
            'product_id' => 1,
            'qty_available' => 75,
            'zone' => 'A',
            'rack' => '01',
            'bin' => 'C3'
        ]);

        // Verify stock movement log captures shifting out & in
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => 1,
            'movement_type' => 'PUTAWAY',
            'qty_change' => -75,
            'zone' => 'Default'
        ]);
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => 1,
            'movement_type' => 'PUTAWAY',
            'qty_change' => 75,
            'zone' => 'A'
        ]);

        // Test editing Putaway shelf location (relocation correction)
        $putaway = \App\Models\Putaway::where('gr_item_id', $item1->gr_item_id)->first();
        $putawayId = $putaway->putaway_id;

        $response = $this->actingAs($pic)->putJson("/api/putaway/{$putawayId}", [
            'zone' => 'B',
            'rack' => '02',
            'bin' => 'D4'
        ]);
        $response->assertStatus(200);

        // Verify putaway coordinates updated
        $this->assertDatabaseHas('putaways', [
            'putaway_id' => $putawayId,
            'zone' => 'B',
            'rack' => '02',
            'bin' => 'D4'
        ]);

        // Verify stock coordinates updated to B
        $this->assertDatabaseHas('stock', [
            'product_id' => 1,
            'qty_available' => 75,
            'zone' => 'B',
            'rack' => '02',
            'bin' => 'D4'
        ]);

        // Now edit back to A/01/C3 to preserve later phases
        $response = $this->actingAs($pic)->putJson("/api/putaway/{$putawayId}", [
            'zone' => 'A',
            'rack' => '01',
            'bin' => 'C3'
        ]);
        $response->assertStatus(200);

        // Verify putaway coordinates restored
        $this->assertDatabaseHas('putaways', [
            'putaway_id' => $putawayId,
            'zone' => 'A',
            'rack' => '01',
            'bin' => 'C3'
        ]);

        // Verify stock coordinates restored to A
        $this->assertDatabaseHas('stock', [
            'product_id' => 1,
            'qty_available' => 75,
            'zone' => 'A',
            'rack' => '01',
            'bin' => 'C3'
        ]);

        // --- PHASE 5: Material Request ---
        // PIC submits Material Request for 20 NYM Cables (Product 1)
        $response = $this->actingAs($pic)->postJson('/api/material-request', [
            'department_id' => 1,
            'warehouse_id' => 1,
            'requested_by' => 'Staff Ahmad',
            'request_date' => date('Y-m-d'),
            'items' => [
                [
                    'product_id' => 1,
                    'qty_requested' => 20
                ]
            ]
        ]);
        $response->assertStatus(201);
        $mrId = $response->json('data.mr_id');

        // Verify MR pending status
        $this->assertDatabaseHas('material_requests', ['mr_id' => $mrId, 'status' => 'pending']);

        // --- PHASE 6: Master Approval ---
        // QC tries to approve MR (should fail)
        $response = $this->actingAs($qc)->postJson("/api/material-request/{$mrId}/approve");
        $response->assertStatus(403);

        // Master approves the MR
        $response = $this->actingAs($master)->postJson("/api/material-request/{$mrId}/approve");
        $response->assertStatus(200);

        // Verify stock has been deducted from the main shelf balance (75 - 20 = 55)
        $this->assertDatabaseHas('stock', [
            'product_id' => 1,
            'qty_available' => 55,
            'zone' => 'A'
        ]);

        // Verify physical stock movement records deduction
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => 1,
            'movement_type' => 'OUTBOUND',
            'qty_change' => -20,
            'zone' => 'A'
        ]);

        // --- PHASE 7: Goods Issue Release ---
        // PIC drafts the official Goods Issue documentation for the approved MR
        $response = $this->actingAs($pic)->postJson('/api/goods-issue', [
            'mr_id' => $mrId,
            'issue_date' => date('Y-m-d'),
            'notes' => 'Released to Staff Ahmad'
        ]);
        $response->assertStatus(201);
        $giId = $response->json('data.gi_id');
        $this->assertDatabaseHas('goods_issues', ['gi_id' => $giId, 'mr_id' => $mrId]);

        // --- PHASE 8: Stock Opname ---
        // PIC initiates opname for Main Warehouse
        $response = $this->actingAs($pic)->postJson('/api/stock-opname/start', [
            'warehouse_id' => 1,
            'notes' => 'End of month audit'
        ]);
        $response->assertStatus(201);
        $opnameId = $response->json('data.opname_id');

        // PIC counts physical stock: finds only 50 NYM Cables (discrepancy: -5 from system 55)
        $response = $this->actingAs($pic)->postJson("/api/stock-opname/{$opnameId}/count", [
            'items' => [
                [
                    'product_id' => 1,
                    'physical_qty' => 50,
                    'notes' => '5 missing items'
                ]
            ]
        ]);
        $response->assertStatus(200);

        // Master reconciles opname discrepancy
        $response = $this->actingAs($master)->postJson("/api/stock-opname/{$opnameId}/approve");
        $response->assertStatus(200);

        // Verify stock has adjusted to 50
        $this->assertDatabaseHas('stock', [
            'product_id' => 1,
            'qty_available' => 50,
            'zone' => 'A'
        ]);

        // Verify discrepancy logged in stock movements (-5)
        $this->assertDatabaseHas('stock_movements', [
            'product_id' => 1,
            'movement_type' => 'ADJUSTMENT',
            'qty_change' => -5,
            'zone' => 'A'
        ]);

        // --- PHASE 9: Audit Ledger & Reports ---
        // Master pulls unified stock movement report
        $response = $this->actingAs($master)->getJson('/api/reports/stock-movements');
        $response->assertStatus(200);
        $data = $response->json('data');

        // Validate we have multiple movements in the ledger
        $this->assertGreaterThanOrEqual(5, count($data));

        // Master reads administrative activity logs
        $response = $this->actingAs($master)->getJson('/api/reports/activity-logs');
        $response->assertStatus(200);
    }
}
