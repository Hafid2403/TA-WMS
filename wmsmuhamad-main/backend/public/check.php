<?php
require __DIR__.'/../vendor/autoload.php';
$app = require_once __DIR__.'/../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$latest = App\Models\GoodsReceipt::with(['items.product'])->orderBy('gr_id', 'desc')->take(2)->get();
foreach ($latest as $gr) {
    echo "GR: {$gr->gr_number} | ID: {$gr->gr_id}\n";
    foreach ($gr->items as $item) {
        echo "  Item: {$item->product->product_name} | Qty Recv: {$item->qty_received} | Accepted: {$item->qty_accepted} | Rejected: {$item->qty_rejected} | Status: {$item->qc_status}\n";
    }
}
