<?php

namespace App\Http\Controllers;

use App\Models\Putaway;
use App\Models\GoodsReceiptItem;
use App\Models\Stock;
use App\Helpers\ActivityLogger;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class PutawayController extends Controller
{
    /**
     * List putaways with parent goods receipt items.
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $query = Putaway::with(['goodsReceiptItem.goodsReceipt', 'product.stocks', 'warehouse', 'operator']);

        if ($user->warehouse_id) {
            $query->where('warehouse_id', $user->warehouse_id);
        }

        $putaways = $query->orderBy('created_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $putaways
        ], Response::HTTP_OK);
    }

    /**
     * Log a physical Putaway placement.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'gr_item_id' => 'required|exists:goods_receipt_items,gr_item_id',
            'zone' => 'required|string|max:10',
            'rack' => 'required|string|max:10',
            'bin' => 'required|string|max:10',
            'qty_placed' => 'required|integer|min:1',
            'placed_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $item = GoodsReceiptItem::with('goodsReceipt')->findOrFail($request->gr_item_id);

        $user = $request->user();

        // Enforce warehouse boundary access control
        if ($user->warehouse_id && (int)$item->goodsReceipt->warehouse_id !== (int)$user->warehouse_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Unauthorized warehouse access.',
            ], Response::HTTP_FORBIDDEN);
        }

        if (!in_array($item->qc_status, ['passed', 'partial'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Cannot execute putaway. QC Inspection has status: ' . $item->qc_status . ' (expected passed or partial).',
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $qtyPlacedAlready = Putaway::where('gr_item_id', $item->gr_item_id)->sum('qty_placed');
        $qtyAvailableForPutaway = $item->qty_accepted - $qtyPlacedAlready;
        $qtyPlaced = (int) $request->qty_placed;

        if ($qtyPlaced > $qtyAvailableForPutaway) {
            return response()->json([
                'status' => 'error',
                'message' => "Placed quantity ({$qtyPlaced}) exceeds available accepted QC quantity remaining ({$qtyAvailableForPutaway}).",
            ], Response::HTTP_BAD_REQUEST);
        }

        $user = $request->user();

        $putaway = DB::transaction(function () use ($request, $item, $qtyPlaced, $qtyPlacedAlready, $user) {
            $newPutaway = Putaway::create([
                'gr_item_id' => $item->gr_item_id,
                'product_id' => $item->product_id,
                'warehouse_id' => $item->goodsReceipt->warehouse_id,
                'qty_placed' => $qtyPlaced,
                'zone' => $request->zone,
                'rack' => $request->rack,
                'bin' => $request->bin,
                'placed_by' => $user->id,
                'placed_date' => $request->placed_date,
                'status' => ($qtyPlaced + $qtyPlacedAlready === $item->qty_accepted) ? 'completed' : 'pending',
            ]);

            // Update the single unique stock record's coordinates
            $stock = Stock::where('warehouse_id', $item->goodsReceipt->warehouse_id)
                ->where('product_id', $item->product_id)
                ->first();

            if ($stock) {
                $stock->update([
                    'zone' => $request->zone,
                    'rack' => $request->rack,
                    'bin' => $request->bin,
                ]);
            } else {
                Stock::create([
                    'warehouse_id' => $item->goodsReceipt->warehouse_id,
                    'product_id' => $item->product_id,
                    'qty_available' => $qtyPlaced,
                    'qty_reserved' => 0,
                    'zone' => $request->zone,
                    'rack' => $request->rack,
                    'bin' => $request->bin,
                ]);
            }

            // Log physical stock movements (Shift OUT of Default, Shift IN to shelf location)
            \App\Helpers\StockMovementLogger::log(
                $item->product_id,
                $item->goodsReceipt->warehouse_id,
                'PUTAWAY',
                $item->goodsReceipt->gr_number,
                -$qtyPlaced,
                'Default',
                'Default',
                'Default',
                'Putaway Staging Shift Out',
                $user->id
            );

            \App\Helpers\StockMovementLogger::log(
                $item->product_id,
                $item->goodsReceipt->warehouse_id,
                'PUTAWAY',
                $item->goodsReceipt->gr_number,
                $qtyPlaced,
                $request->zone,
                $request->rack,
                $request->bin,
                'Putaway Placement Location Shift In',
                $user->id
            );

            // Log activity
            ActivityLogger::log('PUTAWAY_PLACEMENT', "Operator {$user->name} shifted {$qtyPlaced} units of Product ID {$item->product_id} from Default QC Staging to Shelf Zone {$request->zone}, Rack {$request->rack}, Bin {$request->bin}.");

            return $newPutaway;
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Putaway placement recorded successfully. Stock location quantities adjusted.',
            'data' => $putaway
        ], Response::HTTP_CREATED);
    }

    /**
     * Update an existing Putaway shelf location.
     */
    public function update(Request $request, $id)
    {
        $validator = Validator::make($request->all(), [
            'zone' => 'required|string|max:10',
            'rack' => 'required|string|max:10',
            'bin' => 'required|string|max:10',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $putaway = Putaway::findOrFail($id);
        $user = $request->user();

        if ($user->warehouse_id && (int)$putaway->warehouse_id !== (int)$user->warehouse_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Forbidden. You do not have access to this warehouse.',
            ], Response::HTTP_FORBIDDEN);
        }

        DB::transaction(function () use ($request, $putaway, $user) {
            $oldZone = $putaway->zone;
            $oldRack = $putaway->rack;
            $oldBin = $putaway->bin;

            $putaway->update([
                'zone' => $request->zone,
                'rack' => $request->rack,
                'bin' => $request->bin,
            ]);

            // Update Stock location
            $stock = Stock::where('warehouse_id', $putaway->warehouse_id)
                ->where('product_id', $putaway->product_id)
                ->first();

            if ($stock) {
                $stock->update([
                    'zone' => $request->zone,
                    'rack' => $request->rack,
                    'bin' => $request->bin,
                ]);
            }

            // Log relocation movements
            $grNumber = $putaway->goodsReceiptItem->goodsReceipt->gr_number ?? 'PA-EDIT';
            
            \App\Helpers\StockMovementLogger::log(
                $putaway->product_id,
                $putaway->warehouse_id,
                'PUTAWAY',
                $grNumber,
                -$putaway->qty_placed,
                $oldZone,
                $oldRack,
                $oldBin,
                'Putaway Placement Location Correction Out',
                $user->id
            );

            \App\Helpers\StockMovementLogger::log(
                $putaway->product_id,
                $putaway->warehouse_id,
                'PUTAWAY',
                $grNumber,
                $putaway->qty_placed,
                $request->zone,
                $request->rack,
                $request->bin,
                'Putaway Placement Location Correction In',
                $user->id
            );

            ActivityLogger::log(
                'PUTAWAY_EDIT',
                "Operator {$user->name} updated Putaway ID {$putaway->putaway_id} shelf location from {$oldZone}/{$oldRack}/{$oldBin} to {$request->zone}/{$request->rack}/{$request->bin}."
            );
        });

        return response()->json([
            'status' => 'success',
            'message' => 'Putaway shelf location updated successfully.',
            'data' => $putaway->load(['goodsReceiptItem.goodsReceipt', 'product.stocks', 'warehouse'])
        ], Response::HTTP_OK);
    }
}

