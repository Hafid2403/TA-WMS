<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class WMSAPISmokeTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed();
    }

    /**
     * Test that all protected routes reject unauthenticated guests.
     */
    public function test_unauthenticated_api_endpoints_return_unauthorized(): void
    {
        $endpoints = [
            ['GET', '/api/dashboard/summary'],
            ['GET', '/api/goods-receipt'],
            ['POST', '/api/goods-receipt'],
            ['GET', '/api/material-request'],
            ['POST', '/api/material-request'],
            ['GET', '/api/stock-opname'],
            ['POST', '/api/stock-opname/start'],
            ['GET', '/api/purchase-orders'],
            ['POST', '/api/purchase-orders'],
            ['GET', '/api/putaway'],
            ['POST', '/api/putaway'],
            ['GET', '/api/goods-issue'],
            ['POST', '/api/goods-issue'],
            ['GET', '/api/reports/activity-logs'],
            ['GET', '/api/reports/stock-movements'],
        ];

        foreach ($endpoints as $endpoint) {
            $method = $endpoint[0];
            $url = $endpoint[1];

            if ($method === 'GET') {
                $response = $this->getJson($url);
            } else {
                $response = $this->postJson($url, []);
            }

            // Must reject as unauthorized 401
            $response->assertStatus(401);
        }
    }

    /**
     * Test authorized access smoke testing.
     */
    public function test_authenticated_dashboard_smoke(): void
    {
        $master = User::where('email', 'master@wms.com')->first();
        $this->assertNotNull($master);

        // Access dashboard summary
        $response = $this->actingAs($master)->getJson('/api/dashboard/summary');
        $response->assertStatus(200);

        // Access goods receipts list
        $response = $this->actingAs($master)->getJson('/api/goods-receipt');
        $response->assertStatus(200);

        // Access purchase orders list
        $response = $this->actingAs($master)->getJson('/api/purchase-orders');
        $response->assertStatus(200);

        // Access material requests list
        $response = $this->actingAs($master)->getJson('/api/material-request');
        $response->assertStatus(200);

        // Access putaway list
        $response = $this->actingAs($master)->getJson('/api/putaway');
        $response->assertStatus(200);

        // Access stock opnames list
        $response = $this->actingAs($master)->getJson('/api/stock-opname');
        $response->assertStatus(200);

        // Access goods issue list
        $response = $this->actingAs($master)->getJson('/api/goods-issue');
        $response->assertStatus(200);

        // Access audit activity logs
        $response = $this->actingAs($master)->getJson('/api/reports/activity-logs');
        $response->assertStatus(200);

        // Access stock movements audit trail
        $response = $this->actingAs($master)->getJson('/api/reports/stock-movements');
        $response->assertStatus(200);
    }
}
