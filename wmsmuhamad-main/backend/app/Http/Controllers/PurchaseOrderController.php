<?php

namespace App\Http\Controllers;

use App\Models\PurchaseOrder;
use App\Models\PurchaseOrderItem;
use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\VendorProduct;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class PurchaseOrderController extends Controller
{
    /**
     * List all Purchase Orders.
     */
    public function index(Request $request)
    {
        $query = PurchaseOrder::with(['vendor', 'items.product']);
        $pos = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $pos
        ], Response::HTTP_OK);
    }

    /**
     * Display a specific Purchase Order and its line items.
     */
    public function show($id)
    {
        $po = PurchaseOrder::with(['vendor', 'items.product', 'goodsReceipts'])->find($id);

        if (!$po) {
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase order not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status' => 'success',
            'data' => $po
        ], Response::HTTP_OK);
    }

    /**
     * Store a new Purchase Order (Master-only).
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:vendors,vendor_id',
            'po_date' => 'required|date',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.qty_ordered' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $po = DB::transaction(function () use ($request) {
            $latest = PurchaseOrder::latest('po_id')->first();
            $nextId = $latest ? $latest->po_id + 1 : 1;
            $poNumber = 'PO-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $newPo = PurchaseOrder::create([
                'po_number' => $poNumber,
                'vendor_id' => $request->vendor_id,
                'po_date' => $request->po_date,
                'status' => 'ordered',
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                PurchaseOrderItem::create([
                    'po_id' => $newPo->po_id,
                    'product_id' => $item['product_id'],
                    'qty_ordered' => $item['qty_ordered'],
                    'qty_received' => 0,
                ]);
            }

            // Log activity audit
            ActivityLogger::log('PURCHASE_ORDER_CREATE', "Created Purchase Order {$poNumber} for Vendor ID {$request->vendor_id}.");

            return $newPo;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Purchase order created and ordered successfully.',
            'data' => $po->load('items')
        ], Response::HTTP_CREATED);
    }

    /**
     * Record a Goods Receipt referencing this PO.
     */
    public function receive(Request $request, $id)
    {
        $po = PurchaseOrder::with('items')->find($id);

        if (!$po) {
            return response()->json([
                'status' => 'error',
                'message' => 'Purchase Order not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        if (in_array($po->status, ['completed', 'cancelled'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot receive items against a ' . $po->status . ' Purchase Order.',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $validator = Validator::make($request->all(), [
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'receipt_date' => 'required|date',
            'receipt_type' => 'required|in:good_receipt,pending_order',
            'notes' => 'nullable|string',
            'items' => 'required|array|min:1',
            'items.*.vendor_product_id' => 'required|exists:vendor_products,vendor_product_id',
            'items.*.qty_received' => 'required|integer|min:1',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        $receipt = DB::transaction(function () use ($request, $po, $user) {
            $latest = GoodsReceipt::latest('gr_id')->first();
            $nextId = $latest ? $latest->gr_id + 1 : 1;
            $grNumber = 'GR-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            // 1. Create Goods Receipt
            $gr = GoodsReceipt::create([
                'gr_number' => $grNumber,
                'po_id' => $po->po_id,
                'warehouse_id' => $request->warehouse_id,
                'vendor_id' => $po->vendor_id,
                'received_by' => $user->id,
                'receipt_date' => $request->receipt_date,
                'receipt_type' => $request->receipt_type,
                'notes' => $request->notes,
            ]);

            // 2. Map and match receipt items
            foreach ($request->items as $item) {
                $vp = VendorProduct::findOrFail($item['vendor_product_id']);
                $qtyReceived = (int) $item['qty_received'];

                // Create Receipt Item
                GoodsReceiptItem::create([
                    'gr_id' => $gr->gr_id,
                    'vendor_product_id' => $item['vendor_product_id'],
                    'product_id' => $vp->product_id,
                    'qty_received' => $qtyReceived,
                    'qty_accepted' => 0,
                    'qty_rejected' => 0,
                    'qc_status' => 'pending',
                ]);

                // Increment PO item received quantity
                $poItem = PurchaseOrderItem::where('po_id', $po->po_id)
                    ->where('product_id', $vp->product_id)
                    ->first();

                if ($poItem) {
                    $poItem->increment('qty_received', $qtyReceived);
                }
            }

            // 3. Evaluate if PO status should be updated
            $po->refresh();
            $allCompleted = true;
            $anyReceived = false;

            foreach ($po->items as $poItem) {
                if ($poItem->qty_received < $poItem->qty_ordered) {
                    $allCompleted = false;
                }
                if ($poItem->qty_received > 0) {
                    $anyReceived = true;
                }
            }

            if ($allCompleted) {
                $po->update(['status' => 'completed']);
            } elseif ($anyReceived) {
                $po->update(['status' => 'partial']);
            }

            // Log activity
            ActivityLogger::log('GOODS_RECEIPT_PO_LINK', "Recorded Goods Receipt {$grNumber} referencing Purchase Order {$po->po_number}.");

            return $gr;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Goods receipt recorded against Purchase Order successfully. Pending Quality Control inspection.',
            'data' => $receipt->load('items')
        ], Response::HTTP_CREATED);
    }
}
