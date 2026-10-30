<?php

namespace App\Http\Controllers;

use App\Models\GoodsReceipt;
use App\Models\GoodsReceiptItem;
use App\Models\ReturnItem;
use App\Models\Stock;
use App\Models\VendorProduct;
use App\Models\PurchaseOrder;
use App\Helpers\ActivityLogger;
use App\Helpers\StockMovementLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class GoodsReceiptController extends Controller
{
    /**
     * List all goods receipts with eager loaded relations.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = GoodsReceipt::with(['warehouse', 'vendor', 'receiver', 'items.product', 'items.vendorProduct', 'items.qcInspector', 'purchaseOrder']);

        if ($user->warehouse_id) {
            $query->where('warehouse_id', $user->warehouse_id);
        }

        $receipts = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $receipts
        ], Response::HTTP_OK);
    }

    /**
     * Display a specific goods receipt and its line items.
     */
    public function show($id)
    {
        $receipt = GoodsReceipt::with(['warehouse', 'vendor', 'receiver', 'items.product', 'items.vendorProduct', 'items.qcInspector', 'purchaseOrder'])
            ->find($id);

        if (!$receipt) {
            return response()->json([
                'status' => 'error',
                'message' => 'Goods receipt not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        return response()->json([
            'status' => 'success',
            'data' => $receipt
        ], Response::HTTP_OK);
    }

    /**
     * Store a new incoming goods receipt.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'vendor_id' => 'required|exists:vendors,vendor_id',
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'receipt_date' => 'required|date',
            'receipt_type' => 'required|in:good_receipt,pending_order',
            'notes' => 'nullable|string',
            'po_number' => 'nullable|string|max:50',
            'items' => 'required|array|min:1',
            'items.*.product_id' => 'required|exists:products,product_id',
            'items.*.qty_received' => 'required|integer|min:1',
            'items.*.vendor_product_code' => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        // Enforce warehouse boundary access control
        if ($user->warehouse_id && (int)$request->warehouse_id !== (int)$user->warehouse_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized warehouse access.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Run as transaction
        $receipt = DB::transaction(function () use ($request, $user) {
            // Check/create PurchaseOrder if po_number is provided
            $po = null;
            if (!empty($request->po_number)) {
                $po = PurchaseOrder::where('po_number', $request->po_number)->first();
                if (!$po) {
                    $po = PurchaseOrder::create([
                        'po_number' => $request->po_number,
                        'vendor_id' => $request->vendor_id,
                        'po_date' => $request->receipt_date,
                        'status' => 'completed',
                        'notes' => 'Auto-created via Goods Receipt creation'
                    ]);
                }
            }

            // Generate standard unique GR number
            $latest = GoodsReceipt::latest('gr_id')->first();
            $nextId = $latest ? $latest->gr_id + 1 : 1;
            $grNumber = 'GR-' . date('Ymd') . '-' . str_pad($nextId, 4, '0', STR_PAD_LEFT);

            $gr = GoodsReceipt::create([
                'gr_number' => $grNumber,
                'po_id' => $po ? $po->po_id : null,
                'warehouse_id' => $request->warehouse_id,
                'vendor_id' => $request->vendor_id,
                'received_by' => $user->id,
                'receipt_date' => $request->receipt_date,
                'receipt_type' => $request->receipt_type,
                'notes' => $request->notes,
            ]);

            foreach ($request->items as $item) {
                // Find or create/update the vendor product mapping for this vendor and product
                $vp = VendorProduct::where('vendor_id', $request->vendor_id)
                    ->where('product_id', $item['product_id'])
                    ->first();
                if ($vp) {
                    if (!empty($item['vendor_product_code'])) {
                        $vp->update(['vendor_product_code' => $item['vendor_product_code']]);
                    }
                } else {
                    $vp = VendorProduct::create([
                        'vendor_id' => $request->vendor_id,
                        'product_id' => $item['product_id'],
                        'vendor_product_code' => !empty($item['vendor_product_code']) ? $item['vendor_product_code'] : 'VP-' . $request->vendor_id . '-' . $item['product_id'],
                        'is_active' => 1
                    ]);
                }

                GoodsReceiptItem::create([
                    'gr_id' => $gr->gr_id,
                    'vendor_product_id' => $vp->vendor_product_id,
                    'product_id' => $item['product_id'],
                    'qty_received' => $item['qty_received'],
                    'qty_accepted' => 0,
                    'qty_rejected' => 0,
                    'qc_status' => 'pending',
                ]);
            }

            return $gr;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Goods receipt created successfully and is pending Quality Control.',
            'data' => $receipt->load('items')
        ], Response::HTTP_CREATED);
    }

    /**
     * Submit Quality Control findings for a goods receipt.
     */
    public function recordQC(Request $request, $id)
    {
        $gr = GoodsReceipt::with('items')->find($id);

        if (!$gr) {
            return response()->json([
                'status' => 'error',
                'message' => 'Goods receipt not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        $validator = Validator::make($request->all(), [
            'items' => 'required|array',
            'items.*.gr_item_id' => 'required|exists:goods_receipt_items,gr_item_id',
            'items.*.qty_accepted' => 'required|integer|min:0',
            'items.*.qty_rejected' => 'required|integer|min:0',
            'items.*.qc_notes' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        DB::transaction(function () use ($request, $gr, $user) {
            foreach ($request->items as $qcItem) {
                $item = GoodsReceiptItem::findOrFail($qcItem['gr_item_id']);

                // Ensure the items match this goods receipt
                if ($item->gr_id !== $gr->gr_id) {
                    continue;
                }

                $accepted = (int) $qcItem['qty_accepted'];
                $rejected = (int) $qcItem['qty_rejected'];

                // Validate sum does not exceed received amount
                if (($accepted + $rejected) > $item->qty_received) {
                    throw new \InvalidArgumentException("Sum of accepted ({$accepted}) and rejected ({$rejected}) quantities cannot exceed received quantity ({$item->qty_received}) for item ID {$item->gr_item_id}.");
                }

                $qcStatus = 'passed';
                if (($accepted + $rejected) < $item->qty_received) {
                    $qcStatus = 'partial';
                } elseif ($rejected > 0 && $accepted === 0) {
                    $qcStatus = 'rejected';
                }

                // Update receipt item
                $item->update([
                    'qty_accepted' => $accepted,
                    'qty_rejected' => $rejected,
                    'qc_status' => $qcStatus,
                    'qc_by' => $user->id,
                    'qc_date' => now(),
                    'qc_notes' => $qcItem['qc_notes'] ?? null,
                ]);

                // 1. Process Stock Mutation for Accepted Quantities
                if ($accepted > 0) {
                    $stock = Stock::where('warehouse_id', $gr->warehouse_id)
                        ->where('product_id', $item->product_id)
                        ->first();

                    if ($stock) {
                        $stock->increment('qty_available', $accepted);
                    } else {
                        Stock::create([
                            'warehouse_id' => $gr->warehouse_id,
                            'product_id' => $item->product_id,
                            'qty_available' => $accepted,
                            'qty_reserved' => 0,
                            'zone' => 'Default',
                            'rack' => 'Default',
                            'bin' => 'Default',
                        ]);
                    }

                    // Log physical stock movement
                    StockMovementLogger::log(
                        $item->product_id,
                        $gr->warehouse_id,
                        'INBOUND',
                        $gr->gr_number,
                        $accepted,
                        'Default',
                        'Default',
                        'Default',
                        'Inbound QC Acceptance Placement',
                        $user->id
                    );
                }

                // 2. Create Vendor Return Logs for Rejected Quantities
                if ($rejected > 0) {
                    ReturnItem::create([
                        'gr_item_id' => $item->gr_item_id,
                        'product_id' => $item->product_id,
                        'vendor_id' => $gr->vendor_id,
                        'qty_returned' => $rejected,
                        'reason' => $qcItem['qc_notes'] ?? 'Rejected during Quality Control inspection.',
                        'return_date' => date('Y-m-d'),
                        'returned_by' => $user->id,
                        'status' => 'pending',
                    ]);

                    // Log return rejection as negative adjustment or return record
                    StockMovementLogger::log(
                        $item->product_id,
                        $gr->warehouse_id,
                        'RETURN',
                        $gr->gr_number,
                        -$rejected,
                        'Default',
                        'Default',
                        'Default',
                        'Rejected Return to Vendor: ' . ($qcItem['qc_notes'] ?? 'QC Rejected'),
                        $user->id
                    );
                }

                // Log system activity log
                ActivityLogger::log(
                    'QC_INSPECTION_SUBMIT',
                    "QC Inspector {$user->name} recorded inspection for Goods Receipt {$gr->gr_number} (Item ID {$item->gr_item_id}). Accepted: {$accepted}, Rejected: {$rejected}.",
                    $user->id
                );
            }
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Quality Control inspection recorded successfully. Stock adjusted and vendor returns drafted where applicable.',
        ], Response::HTTP_OK);
    }

    /**
     * Get vendor return records.
     */
    /**
     * Update an existing goods receipt header fields.
     */
    public function update(Request $request, $id)
    {
        $user = $request->user();
        if ($user && $user->role === 'pic') {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized action for PIC role.'
            ], Response::HTTP_FORBIDDEN);
        }

        $receipt = GoodsReceipt::find($id);
        if (!$receipt) {
            return response()->json([
                'status' => 'error',
                'message' => 'Goods receipt not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        $data = $request->validate([
            'vendor_id' => 'sometimes|exists:vendors,vendor_id',
            'warehouse_id' => 'sometimes|exists:warehouses,warehouse_id',
            'receipt_date' => 'sometimes|date',
            'receipt_type' => 'sometimes|in:good_receipt,pending_order',
            'notes' => 'nullable|string',
            'po_number' => 'nullable|string|max:50',
        ]);

        DB::transaction(function () use ($receipt, $data) {
            $receipt->update(collect($data)->except('po_number')->toArray());

            if (array_key_exists('po_number', $data)) {
                $po = null;
                if (!empty($data['po_number'])) {
                    $po = PurchaseOrder::where('po_number', $data['po_number'])->first();
                    if (!$po) {
                        $po = PurchaseOrder::create([
                            'po_number' => $data['po_number'],
                            'vendor_id' => $data['vendor_id'] ?? $receipt->vendor_id,
                            'po_date' => $data['receipt_date'] ?? $receipt->receipt_date,
                            'status' => 'completed',
                            'notes' => 'Auto-created via Goods Receipt update'
                        ]);
                    }
                }
                $receipt->update(['po_id' => $po ? $po->po_id : null]);
            }

            if (isset($data['vendor_id'])) {
                foreach ($receipt->items as $item) {
                    $vp = VendorProduct::firstOrCreate(
                        [
                            'vendor_id' => $data['vendor_id'],
                            'product_id' => $item->product_id,
                        ],
                        [
                            'vendor_product_code' => 'VP-' . $data['vendor_id'] . '-' . $item->product_id,
                            'is_active' => 1
                        ]
                    );

                    $item->update([
                        'vendor_product_id' => $vp->vendor_product_id
                    ]);
                }
            }
        });

        return response()->json([
            'status' => 'success',
            'data' => $receipt->load(['warehouse', 'vendor', 'receiver', 'items.product'])
        ], Response::HTTP_OK);
    }

    /**
     * Delete a goods receipt and its associated items.
     */
    public function destroy(Request $request, $id)
    {
        $user = $request->user();
        if ($user && $user->role === 'pic') {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized action for PIC role.'
            ], Response::HTTP_FORBIDDEN);
        }

        $receipt = GoodsReceipt::find($id);
        if (!$receipt) {
            return response()->json([
                'status' => 'error',
                'message' => 'Goods receipt not found.',
            ], Response::HTTP_NOT_FOUND);
        }

        DB::transaction(function () use ($receipt) {
            $receipt->items()->delete();
            $receipt->delete();
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Goods receipt deleted successfully.'
        ], Response::HTTP_OK);
    }

    public function returnsList(Request $request)
    {
        $user = $request->user();
        
        $query = ReturnItem::with(['goodsReceiptItem.goodsReceipt.purchaseOrder', 'product', 'vendor', 'returner']);

        // Filter returns based on user access
        if ($user->warehouse_id) {
            $query->whereHas('goodsReceiptItem.goodsReceipt', function ($q) use ($user) {
                $q->where('warehouse_id', $user->warehouse_id);
            });
        }

        $returns = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $returns
        ], Response::HTTP_OK);
    }

    public function addQcQty(Request $request, $itemId)
    {
        $user = $request->user();
        $item = GoodsReceiptItem::findOrFail($itemId);
        $gr = $item->goodsReceipt;

        $request->validate([
            'qty_accepted_add' => 'nullable|integer|min:0',
            'qty_rejected_add' => 'nullable|integer|min:0',
            'qc_notes' => 'nullable|string',
        ]);

        $acceptedAdd = (int) ($request->qty_accepted_add ?? 0);
        $rejectedAdd = (int) ($request->qty_rejected_add ?? 0);

        $newAccepted = $item->qty_accepted + $acceptedAdd;
        $newRejected = $item->qty_rejected + $rejectedAdd;

        if (($newAccepted + $newRejected) > $item->qty_received) {
            return response()->json([
                'status' => 'error',
                'message' => "Jumlah akumulasi accepted ({$newAccepted}) dan rejected ({$newRejected}) tidak boleh melebihi qty received ({$item->qty_received}).",
            ], Response::HTTP_BAD_REQUEST);
        }

        DB::transaction(function () use ($gr, $item, $user, $acceptedAdd, $rejectedAdd, $newAccepted, $newRejected, $request) {
            $qcStatus = 'partial';
            if (($newAccepted + $newRejected) === $item->qty_received) {
                if ($newRejected > 0 && $newAccepted === 0) {
                    $qcStatus = 'rejected';
                } else {
                    $qcStatus = 'passed';
                }
            }

            $item->update([
                'qty_accepted' => $newAccepted,
                'qty_rejected' => $newRejected,
                'qc_status' => $qcStatus,
                'qc_by' => $user->id,
                'qc_date' => now(),
                'qc_notes' => $request->qc_notes ?? $item->qc_notes,
            ]);

            // 1. Process Stock Mutation for newly Accepted Quantities
            if ($acceptedAdd > 0) {
                $stock = Stock::where('warehouse_id', $gr->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                if ($stock) {
                    $stock->increment('qty_available', $acceptedAdd);
                } else {
                    Stock::create([
                        'warehouse_id' => $gr->warehouse_id,
                        'product_id' => $item->product_id,
                        'qty_available' => $acceptedAdd,
                        'qty_reserved' => 0,
                        'zone' => 'Default',
                        'rack' => 'Default',
                        'bin' => 'Default',
                    ]);
                }

                // Log physical stock movement
                StockMovementLogger::log(
                    $item->product_id,
                    $gr->warehouse_id,
                    'INBOUND',
                    $gr->gr_number,
                    $acceptedAdd,
                    'Default',
                    'Default',
                    'Default',
                    $request->qc_notes ?? 'Stock added via QC additional inspection.',
                    $user->id
                );
            }

            // 2. Process Return / Vendor Rejection for newly Rejected Quantities
            if ($rejectedAdd > 0) {
                ReturnItem::create([
                    'gr_item_id' => $item->gr_item_id,
                    'product_id' => $item->product_id,
                    'vendor_id' => $gr->vendor_id,
                    'qty_returned' => $rejectedAdd,
                    'reason' => $request->qc_notes ?? 'Rejected during additional QC inspection.',
                    'status' => 'pending',
                    'returned_by' => $user->id,
                    'return_date' => now(),
                ]);

                ActivityLogger::log(
                    'QC_REJECT_RETURN',
                    'Rejected Return to Vendor: ' . ($request->qc_notes ?? 'Additional QC Rejection') . " (Qty: {$rejectedAdd})",
                    $user->id
                );
            }

            ActivityLogger::log('QC_INSPECTION_ADD', "QC Inspector {$user->name} recorded additional inspection on GR item ID {$item->gr_item_id} (Accepted: +{$acceptedAdd}, Rejected: +{$rejectedAdd}).", $user->id);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Additional QC quantity inspection successfully recorded. Stock levels adjusted.',
            'data' => $item->fresh(['product'])
        ], Response::HTTP_OK);
    }

    /**
     * Re-adjust or edit the proportion of accepted and rejected quantities for a fully inspected GR item.
     */
    public function editQcProportion(Request $request, $itemId)
    {
        $user = $request->user();
        $item = GoodsReceiptItem::findOrFail($itemId);
        $gr = $item->goodsReceipt;

        $request->validate([
            'qty_accepted' => 'required|integer|min:0',
            'qty_rejected' => 'required|integer|min:0',
            'qc_notes' => 'nullable|string',
        ]);

        $newAccepted = (int) $request->qty_accepted;
        $newRejected = (int) $request->qty_rejected;

        if (($newAccepted + $newRejected) !== $item->qty_received) {
            return response()->json([
                'status' => 'error',
                'message' => "Jumlah accepted ({$newAccepted}) dan rejected ({$newRejected}) harus sama dengan qty received ({$item->qty_received}).",
            ], Response::HTTP_BAD_REQUEST);
        }

        // Calculate differences for stock adjustments
        $diffAccepted = $newAccepted - $item->qty_accepted;
        $diffRejected = $newRejected - $item->qty_rejected;

        DB::transaction(function () use ($gr, $item, $user, $newAccepted, $newRejected, $diffAccepted, $diffRejected, $request) {
            $qcStatus = 'passed';
            if ($newRejected > 0 && $newAccepted === 0) {
                $qcStatus = 'rejected';
            }

            $item->update([
                'qty_accepted' => $newAccepted,
                'qty_rejected' => $newRejected,
                'qc_status' => $qcStatus,
                'qc_by' => $user->id,
                'qc_date' => now(),
                'qc_notes' => $request->qc_notes ?? $item->qc_notes,
            ]);

            // Adjust Stock based on difference
            if ($diffAccepted !== 0) {
                $stock = Stock::where('warehouse_id', $gr->warehouse_id)
                    ->where('product_id', $item->product_id)
                    ->first();

                if ($stock) {
                    $stock->increment('qty_available', $diffAccepted);
                } else {
                    Stock::create([
                        'warehouse_id' => $gr->warehouse_id,
                        'product_id' => $item->product_id,
                        'qty_available' => $diffAccepted,
                        'qty_reserved' => 0,
                        'zone' => 'Default',
                        'rack' => 'Default',
                        'bin' => 'Default',
                    ]);
                }

                // Log physical stock movement
                StockMovementLogger::log(
                    $item->product_id,
                    $gr->warehouse_id,
                    $diffAccepted > 0 ? 'INBOUND' : 'OUTBOUND',
                    $gr->gr_number,
                    abs($diffAccepted),
                    'Default',
                    'Default',
                    'Default',
                    $diffAccepted > 0 ? 'Stock adjusted via QC proportion increase' : 'Stock adjusted via QC proportion decrease',
                    $user->id
                );
            }

            // Adjust ReturnItem logs based on difference
            if ($diffRejected !== 0) {
                $returnItem = ReturnItem::where('gr_item_id', $item->gr_item_id)->first();
                if ($returnItem) {
                    $newReturnQty = $returnItem->qty_returned + $diffRejected;
                    if ($newReturnQty <= 0) {
                        $returnItem->delete();
                    } else {
                        $returnItem->update([
                            'qty_returned' => $newReturnQty,
                            'reason' => $request->qc_notes ?? $returnItem->reason,
                        ]);
                    }
                } else if ($newRejected > 0) {
                    ReturnItem::create([
                        'gr_item_id' => $item->gr_item_id,
                        'product_id' => $item->product_id,
                        'vendor_id' => $gr->vendor_id,
                        'qty_returned' => $newRejected,
                        'reason' => $request->qc_notes ?? 'Adjusted during QC proportion edit.',
                        'return_date' => date('Y-m-d'),
                        'returned_by' => $user->id,
                        'status' => 'pending',
                    ]);
                }
            }

            ActivityLogger::log('QC_INSPECTION_PROP_EDIT', "QC Inspector {$user->name} edited QC proportion on GR item ID {$item->gr_item_id} (New Accepted: {$newAccepted}, New Rejected: {$newRejected}).", $user->id);
        });

        return response()->json([
            'status' => 'success',
            'message' => 'QC proportion successfully adjusted. Stock levels adjusted.',
            'data' => $item->fresh(['product'])
        ], Response::HTTP_OK);
    }
}
