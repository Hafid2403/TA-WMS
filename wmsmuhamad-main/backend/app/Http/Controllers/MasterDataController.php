<?php

namespace App\Http\Controllers;

use App\Models\Warehouse;
use App\Models\Department;
use App\Models\Vendor;
use App\Models\ProductCategory;
use App\Models\Product;
use App\Models\VendorProduct;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class MasterDataController extends Controller
{
    public function warehouses(Request $request)
    {
        $user = $request->user();
        $query = Warehouse::query();
        if ($user && $user->warehouse_id) {
            $query->where('warehouse_id', $user->warehouse_id);
        }
        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ], Response::HTTP_OK);
    }

    public function storeWarehouse(Request $request)
    {
        $data = $request->validate([
            'warehouse_name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'is_active' => 'sometimes|boolean'
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $warehouse = Warehouse::create($data);
        return response()->json([
            'status' => 'success',
            'data' => $warehouse
        ], Response::HTTP_CREATED);
    }

    public function updateWarehouse(Request $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);
        $data = $request->validate([
            'warehouse_name' => 'required|string|max:255',
            'address' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'is_active' => 'sometimes|boolean'
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $warehouse->update($data);
        return response()->json([
            'status' => 'success',
            'data' => $warehouse
        ], Response::HTTP_OK);
    }

    public function destroyWarehouse($id)
    {
        $warehouse = Warehouse::findOrFail($id);
        $warehouse->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Warehouse deleted successfully'
        ], Response::HTTP_OK);
    }

    public function departments()
    {
        return response()->json([
            'status' => 'success',
            'data' => Department::all()
        ], Response::HTTP_OK);
    }

    public function storeDepartment(Request $request)
    {
        $data = $request->validate([
            'department_name' => 'required|string|max:255',
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean'
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $department = Department::create($data);
        return response()->json([
            'status' => 'success',
            'data' => $department
        ], Response::HTTP_CREATED);
    }

    public function updateDepartment(Request $request, $id)
    {
        $department = Department::findOrFail($id);
        $data = $request->validate([
            'department_name' => 'required|string|max:255',
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean'
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $department->update($data);
        return response()->json([
            'status' => 'success',
            'data' => $department
        ], Response::HTTP_OK);
    }

    public function destroyDepartment($id)
    {
        $department = Department::findOrFail($id);
        $department->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Department deleted successfully'
        ], Response::HTTP_OK);
    }

    public function vendors()
    {
        return response()->json([
            'status' => 'success',
            'data' => Vendor::all()
        ], Response::HTTP_OK);
    }

    public function storeVendor(Request $request)
    {
        $data = $request->validate([
            'vendor_name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'is_active' => 'sometimes|boolean'
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $vendor = Vendor::create($data);

        // Automatically link existing products to this new vendor
        $products = \App\Models\Product::all();
        foreach ($products as $product) {
            \App\Models\VendorProduct::create([
                'vendor_id' => $vendor->vendor_id,
                'product_id' => $product->product_id,
                'vendor_product_code' => $product->internal_code,
                'unit_price' => 0
            ]);
        }

        return response()->json([
            'status' => 'success',
            'data' => $vendor
        ], Response::HTTP_CREATED);
    }

    public function updateVendor(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);
        $data = $request->validate([
            'vendor_name' => 'required|string|max:255',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'is_active' => 'sometimes|boolean'
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $vendor->update($data);
        return response()->json([
            'status' => 'success',
            'data' => $vendor
        ], Response::HTTP_OK);
    }

    public function destroyVendor($id)
    {
        $vendor = Vendor::findOrFail($id);
        $vendor->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Vendor deleted successfully'
        ], Response::HTTP_OK);
    }

    public function categories()
    {
        return response()->json([
            'status' => 'success',
            'data' => ProductCategory::all()
        ], Response::HTTP_OK);
    }

    public function products(Request $request)
    {
        $user = $request->user();
        $query = Product::with(['category', 'stocks']);

        $warehouseId = $request->input('warehouse_id');
        if ($user && $user->warehouse_id) {
            $warehouseId = $user->warehouse_id;
        }

        // Support per-warehouse stock filtering
        if ($warehouseId) {
            // Only show products linked to their assigned warehouse
            $query->whereHas('stocks', function ($q) use ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            });
            $query->withSum(['stocks as stocks_sum_qty_available' => function ($q) use ($warehouseId) {
                $q->where('warehouse_id', $warehouseId);
            }], 'qty_available');
        } else {
            $query->withSum('stocks as stocks_sum_qty_available', 'qty_available');
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ], Response::HTTP_OK);
    }

    public function storeProduct(Request $request)
    {
        $categoryName = $request->input('category_name');
        if ($categoryName) {
            $category = ProductCategory::firstOrCreate([
                'category_name' => $categoryName
            ]);
            $request->merge(['category_id' => $category->category_id]);
        }

        $data = $request->validate([
            'product_name' => 'required|string|max:255',
            'internal_code' => 'required|string|unique:products,internal_code',
            'category_id' => 'required|exists:product_categories,category_id',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'warehouse_ids' => 'nullable|array',
            'warehouse_ids.*' => 'exists:warehouses,warehouse_id',
            'warehouse_stocks' => 'nullable|array'
        ]);

        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }

        $warehouseIds = $request->input('warehouse_ids', []);
        $warehouseStocks = $request->input('warehouse_stocks', []);
        $product = Product::create(\Illuminate\Support\Arr::except($data, ['warehouse_ids', 'warehouse_stocks']));

        // Automatically link this new product to all active vendors
        $vendors = \App\Models\Vendor::all();
        foreach ($vendors as $vendor) {
            \App\Models\VendorProduct::create([
                'vendor_id' => $vendor->vendor_id,
                'product_id' => $product->product_id,
                'vendor_product_code' => $product->internal_code,
                'unit_price' => 0
            ]);
        }

        // Initialize stock rows for selected warehouses with direct initial quantities
        foreach ($warehouseIds as $whId) {
            $qty = isset($warehouseStocks[$whId]) ? (int)$warehouseStocks[$whId] : 0;
            \App\Models\Stock::updateOrCreate(
                ['warehouse_id' => $whId, 'product_id' => $product->product_id],
                [
                    'qty_available' => $qty,
                    'qty_reserved' => 0,
                    'zone' => 'Default',
                    'rack' => 'Default',
                    'bin' => 'Default'
                ]
            );
        }

        return response()->json([
            'status' => 'success',
            'data' => $product->load(['category', 'stocks'])
        ], Response::HTTP_CREATED);
    }

    public function updateProduct(Request $request, $id)
    {
        $product = Product::findOrFail($id);

        $categoryName = $request->input('category_name');
        if ($categoryName) {
            $category = ProductCategory::firstOrCreate([
                'category_name' => $categoryName
            ]);
            $request->merge(['category_id' => $category->category_id]);
        }

        $data = $request->validate([
            'product_name' => 'required|string|max:255',
            'internal_code' => 'required|string|unique:products,internal_code,' . $id . ',product_id',
            'category_id' => 'required|exists:product_categories,category_id',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|integer|min:0',
            'is_active' => 'sometimes|boolean',
            'warehouse_ids' => 'nullable|array',
            'warehouse_ids.*' => 'exists:warehouses,warehouse_id',
            'warehouse_stocks' => 'nullable|array'
        ]);

        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }

        $warehouseIds = $request->input('warehouse_ids', []);
        $warehouseStocks = $request->input('warehouse_stocks', []);
        $product->update(\Illuminate\Support\Arr::except($data, ['warehouse_ids', 'warehouse_stocks']));

        // Synchronize warehouse stocks
        $currentWarehouseIds = \App\Models\Stock::where('product_id', $product->product_id)
            ->pluck('warehouse_id')
            ->toArray();

        // Update or add selected warehouse stocks
        foreach ($warehouseIds as $whId) {
            $qty = isset($warehouseStocks[$whId]) ? (int)$warehouseStocks[$whId] : 0;
            $stock = \App\Models\Stock::where('warehouse_id', $whId)
                ->where('product_id', $product->product_id)
                ->first();

            if ($stock) {
                $stock->update([
                    'qty_available' => $qty
                ]);
            } else {
                \App\Models\Stock::create([
                    'warehouse_id' => $whId,
                    'product_id' => $product->product_id,
                    'qty_available' => $qty,
                    'qty_reserved' => 0,
                    'zone' => 'Default',
                    'rack' => 'Default',
                    'bin' => 'Default'
                ]);
            }
        }

        // Remove deselected mappings that have 0 stock
        $toRemove = array_diff($currentWarehouseIds, $warehouseIds);
        foreach ($toRemove as $whId) {
            \App\Models\Stock::where('product_id', $product->product_id)
                ->where('warehouse_id', $whId)
                ->where('qty_available', 0)
                ->where('qty_reserved', 0)
                ->delete();
        }

        return response()->json([
            'status' => 'success',
            'data' => $product->load(['category', 'stocks'])
        ], Response::HTTP_OK);
    }

    public function destroyProduct($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json([
            'status' => 'success',
            'message' => 'Product deleted successfully'
        ], Response::HTTP_OK);
    }

    public function vendorProducts(Request $request)
    {
        $query = VendorProduct::with(['product', 'vendor']);
        if ($request->has('vendor_id') && $request->vendor_id) {
            $query->where('vendor_id', $request->vendor_id);
        }
        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ], Response::HTTP_OK);
    }

    public function users(Request $request)
    {
        $currentUser = $request->user();
        $query = \App\Models\User::with(['role', 'warehouse']);

        // If the logged-in user is Master (role_id = 1), only show users in their warehouse
        if ($currentUser && $currentUser->role_id === 1) {
            $query->where('warehouse_id', $currentUser->warehouse_id);
        }

        return response()->json([
            'status' => 'success',
            'data' => $query->get()
        ], Response::HTTP_OK);
    }

    public function storeUser(Request $request)
    {
        $currentUser = $request->user();

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,role_id',
            'warehouse_id' => 'nullable|exists:warehouses,warehouse_id',
            'is_active' => 'sometimes|boolean'
        ]);

        if ($currentUser && $currentUser->role_id === 1) {
            // Force warehouse_id to Master's warehouse
            $data['warehouse_id'] = $currentUser->warehouse_id;

            // Set status based on the role being created
            if ((int)$data['role_id'] === 1) {
                $data['is_active'] = false;
                $data['status'] = 'pending';
            } else {
                $data['is_active'] = true;
                $data['status'] = 'active';
            }
        } else {
            if ($request->has('is_active')) {
                $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
            }
            $data['status'] = isset($data['is_active']) && $data['is_active'] ? 'active' : 'inactive';
        }

        $data['password'] = \Illuminate\Support\Facades\Hash::make($data['password']);
        $user = \App\Models\User::create($data);

        return response()->json([
            'status' => 'success',
            'data' => $user->load(['role', 'warehouse'])
        ], Response::HTTP_CREATED);
    }

    public function updateUser(Request $request, $id)
    {
        $currentUser = $request->user();
        $user = \App\Models\User::findOrFail($id);

        // Authorization check: Master can only edit users in their own warehouse
        if ($currentUser && $currentUser->role_id === 1) {
            if ((int)$user->warehouse_id !== (int)$currentUser->warehouse_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki wewenang untuk mengubah user di gudang lain.'
                ], Response::HTTP_FORBIDDEN);
            }
        }

        $data = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'role_id' => 'required|exists:roles,role_id',
            'warehouse_id' => 'nullable|exists:warehouses,warehouse_id',
            'is_active' => 'sometimes|boolean'
        ]);

        if ($currentUser && $currentUser->role_id === 1) {
            // Force warehouse_id to Master's warehouse
            $data['warehouse_id'] = $currentUser->warehouse_id;

            if ((int)$data['role_id'] === 1) {
                if ($user->status === 'pending') {
                    $data['is_active'] = false;
                    $data['status'] = 'pending';
                } else {
                    if ($request->has('is_active')) {
                        $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
                        $data['status'] = $data['is_active'] ? 'active' : 'inactive';
                    }
                }
            } else {
                if ($request->has('is_active')) {
                    $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
                    $data['status'] = $data['is_active'] ? 'active' : 'inactive';
                }
            }
        } else {
            if ($request->has('is_active')) {
                $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
            }
            $data['status'] = isset($data['is_active']) && $data['is_active'] ? 'active' : 'inactive';
        }

        if (isset($data['password']) && !empty($data['password'])) {
            $data['password'] = \Illuminate\Support\Facades\Hash::make($data['password']);
        } else {
            unset($data['password']);
        }

        $user->update($data);

        return response()->json([
            'status' => 'success',
            'data' => $user->load(['role', 'warehouse'])
        ], Response::HTTP_OK);
    }

    public function destroyUser($id)
    {
        $currentUser = request()->user();
        $user = \App\Models\User::findOrFail($id);

        // Authorization check: Master can only delete users in their own warehouse
        if ($currentUser && $currentUser->role_id === 1) {
            if ((int)$user->warehouse_id !== (int)$currentUser->warehouse_id) {
                return response()->json([
                    'status' => 'error',
                    'message' => 'Anda tidak memiliki wewenang untuk menghapus user di gudang lain.'
                ], Response::HTTP_FORBIDDEN);
            }
        }

        // Prevent deleting the primary Master account
        if ($user->email === 'master@wms.com') {
            return response()->json([
                'status' => 'error',
                'message' => 'Akun Administrator Master utama tidak dapat dihapus.'
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'User deleted successfully'
        ], Response::HTTP_OK);
    }

    public function warehouseSignatures(Request $request)
    {
        $request->validate([
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'document_type' => 'required|string',
        ]);

        $sig = \App\Models\WarehouseSignature::where('warehouse_id', $request->warehouse_id)
            ->where('document_type', $request->document_type)
            ->first();

        return response()->json([
            'status' => 'success',
            'data' => $sig
        ], Response::HTTP_OK);
    }

    public function saveWarehouseSignatures(Request $request)
    {
        $data = $request->validate([
            'warehouse_id' => 'required|exists:warehouses,warehouse_id',
            'document_type' => 'required|string',
            'columns' => 'required|array',
        ]);

        $sig = \App\Models\WarehouseSignature::updateOrCreate(
            [
                'warehouse_id' => $data['warehouse_id'],
                'document_type' => $data['document_type'],
            ],
            [
                'columns' => $data['columns'],
            ]
        );

        return response()->json([
            'status' => 'success',
            'data' => $sig
        ], Response::HTTP_OK);
    }
}
