<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Warehouse;
use App\Models\GoodsReceipt;
use App\Models\Product;
use App\Models\Stock;
use App\Models\Role;
use App\Models\ProductCategory;
use App\Models\Vendor;
use App\Models\Department;
use App\Models\ActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Symfony\Component\HttpFoundation\Response;

class SuperadminController extends Controller
{
    /**
     * Helper to map Goods Receipt Status based on items' QC status
     */
    private function getGRStatus($gr)
    {
        if (!$gr->relationLoaded('items') || $gr->items->isEmpty()) {
            return 'Pending QC';
        }

        $statuses = $gr->items->pluck('qc_status')->toArray();

        // If all items are passed
        if (collect($statuses)->every(fn($s) => $s === 'passed')) {
            return 'Completed';
        }

        // If all items are rejected
        if (collect($statuses)->every(fn($s) => $s === 'rejected')) {
            return 'Rejected';
        }

        // If some are passed/rejected/partial
        if (collect($statuses)->contains(fn($s) => in_array($s, ['passed', 'partial', 'rejected']))) {
            return 'Partial';
        }

        return 'Pending QC';
    }

    /**
     * Dashboard aggregation summary for Superadmin.
     */
    public function dashboardSummary(Request $request)
    {
        // 1. Warehouse stats
        $totalWarehouses = Warehouse::count();
        $activeWarehouses = Warehouse::where('status', 'active')->count();
        $maintenanceWarehouses = Warehouse::where('status', 'maintenance')->count();

        // 2. Goods Receipts this month
        $currentMonthGr = GoodsReceipt::whereYear('receipt_date', now()->year)
            ->whereMonth('receipt_date', now()->month)
            ->count();

        // 3. User stats (excluding Super Admins)
        $totalUsers = User::where('role_id', '!=', 4)->count();
        $activeUsers = User::where('role_id', '!=', 4)->where('status', 'active')->count();
        $pendingUsers = User::where('role_id', '!=', 4)->where('status', 'pending')->count();
        $inactiveUsers = User::where('role_id', '!=', 4)->where('status', 'inactive')->count();

        // 4. Critical Stock Alerts count and items
        $criticalStockItems = Product::where('is_active', true)
            ->with(['stocks.warehouse'])
            ->get()
            ->map(function ($product) {
                $totalAvailable = $product->stocks->sum('qty_available');
                return [
                    'product_id' => $product->product_id,
                    'internal_code' => $product->internal_code,
                    'product_name' => $product->product_name,
                    'min_stock' => $product->min_stock,
                    'qty_available' => $totalAvailable,
                    'status' => $totalAvailable === 0 ? 'Out of Stock' : ($totalAvailable <= $product->min_stock ? 'Low Stock' : 'In Stock'),
                    'stocks' => $product->stocks->map(function ($s) {
                        return [
                            'warehouse_name' => $s->warehouse ? $s->warehouse->warehouse_name : 'N/A',
                            'qty_available' => $s->qty_available
                        ];
                    })
                ];
            })
            ->filter(fn($p) => $p['status'] === 'Out of Stock' || $p['status'] === 'Low Stock')
            ->values();

        $stockAlertCount = $criticalStockItems->count();

        // 5. Warehouse Capacity Detail
        $warehousesList = Warehouse::with(['stocks'])->get()->map(function ($wh) {
            $totalStock = $wh->stocks->sum('qty_available');
            $capacity = $wh->capacity ?: 10000;
            $utilization = $capacity > 0 ? round(($totalStock / $capacity) * 100, 1) : 0;
            return [
                'warehouse_id' => $wh->warehouse_id,
                'warehouse_name' => $wh->warehouse_name,
                'city' => $wh->city,
                'capacity' => $capacity,
                'status' => $wh->status,
                'total_stock' => $totalStock,
                'utilization' => $utilization,
            ];
        });

        // 6. Recent Goods Receipts
        $recentGR = GoodsReceipt::with(['warehouse', 'vendor', 'items', 'receiver'])
            ->orderBy('receipt_date', 'desc')
            ->limit(5)
            ->get()
            ->map(function ($gr) {
                return [
                    'gr_id' => $gr->gr_id,
                    'gr_number' => $gr->gr_number,
                    'receipt_date' => $gr->receipt_date->format('Y-m-d'),
                    'warehouse_name' => $gr->warehouse ? $gr->warehouse->warehouse_name : 'N/A',
                    'vendor_name' => $gr->vendor ? $gr->vendor->vendor_name : 'N/A',
                    'items_count' => $gr->items->count(),
                    'received_by' => $gr->receiver ? $gr->receiver->name : 'N/A',
                    'status' => $this->getGRStatus($gr),
                ];
            });

        // 7. Users awaiting activation (excluding Super Admins)
        $pendingUsersList = User::where('status', 'pending')
            ->where('role_id', '!=', 4)
            ->with(['role', 'warehouse'])
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => [
                'total_warehouses' => $totalWarehouses,
                'active_warehouses' => $activeWarehouses,
                'maintenance_warehouses' => $maintenanceWarehouses,
                'current_month_gr' => $currentMonthGr,
                'total_users' => $totalUsers,
                'active_users' => $activeUsers,
                'pending_users_count' => $pendingUsers,
                'inactive_users' => $inactiveUsers,
                'stock_alert_count' => $stockAlertCount,
                'critical_items' => $criticalStockItems,
                'warehouses_capacity' => $warehousesList,
                'recent_goods_receipts' => $recentGR,
                'pending_users' => $pendingUsersList,
            ]
        ], Response::HTTP_OK);
    }

    /**
     * Get detailed warehouse performance data
     */
    public function warehouses(Request $request)
    {
        $warehouses = Warehouse::with(['pic', 'stocks'])->get()->map(function ($wh) {
            $totalStock = $wh->stocks->sum('qty_available');
            $capacity = $wh->capacity ?: 10000;
            $utilization = $capacity > 0 ? round(($totalStock / $capacity) * 100, 1) : 0;

            // Total Goods Receipts for this warehouse in the current month
            $grCount = GoodsReceipt::where('warehouse_id', $wh->warehouse_id)
                ->whereYear('receipt_date', now()->year)
                ->whereMonth('receipt_date', now()->month)
                ->count();

            // Total SKU count stored in this warehouse
            $skuCount = Stock::where('warehouse_id', $wh->warehouse_id)
                ->where('qty_available', '>', 0)
                ->distinct('product_id')
                ->count('product_id');

            // Total users assigned to this warehouse
            $usersCount = User::where('warehouse_id', $wh->warehouse_id)->count();

            return [
                'warehouse_id' => $wh->warehouse_id,
                'warehouse_name' => $wh->warehouse_name,
                'address' => $wh->address,
                'city' => $wh->city,
                'capacity' => $capacity,
                'status' => $wh->status,
                'pic_id' => $wh->pic_id,
                'pic_name' => $wh->pic ? $wh->pic->name : 'N/A',
                'gr_month_count' => $grCount,
                'sku_count' => $skuCount,
                'users_count' => $usersCount,
                'total_stock' => $totalStock,
                'utilization' => $utilization,
            ];
        });

        return response()->json([
            'status' => 'success',
            'data' => $warehouses
        ], Response::HTTP_OK);
    }

    /**
     * Get all roles for user creation/editing (excluding Super Admin role)
     */
    public function roles(Request $request)
    {
        $roles = Role::where('role_id', '!=', 4)->get();
        return response()->json([
            'status' => 'success',
            'data' => $roles
        ], Response::HTTP_OK);
    }

    /**
     * Get list of users with filters (excluding Super Admin users)
     */
    public function users(Request $request)
    {
        $query = User::with(['role', 'warehouse'])->where('role_id', '!=', 4);

        if ($request->filled('role_id')) {
            $query->where('role_id', $request->role_id);
        }

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('status')) {
            $query->where('status', $request->status);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', $search)
                  ->orWhere('email', 'like', $search);
            });
        }

        $users = $query->orderBy('name', 'asc')->get();

        return response()->json([
            'status' => 'success',
            'data' => $users
        ], Response::HTTP_OK);
    }

    /**
     * Create a user
     */
    public function createUser(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users',
            'password' => 'required|string|min:8',
            'role_id' => 'required|exists:roles,role_id|not_in:4',
            'warehouse_id' => 'nullable|exists:warehouses,warehouse_id',
            'status' => 'required|string|in:active,inactive',
        ]);

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'warehouse_id' => $request->warehouse_id,
            'is_active' => $request->status === 'active',
            'status' => $request->status,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'User berhasil dibuat.',
            'data' => $user
        ], Response::HTTP_CREATED);
    }

    /**
     * Update a user
     */
    public function updateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id && $request->status !== 'active') {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.'
            ], Response::HTTP_BAD_REQUEST);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|email|max:255|unique:users,email,' . $id,
            'password' => 'nullable|string|min:8',
            'role_id' => 'required|exists:roles,role_id|not_in:4',
            'warehouse_id' => 'nullable|exists:warehouses,warehouse_id',
            'status' => 'required|string|in:active,inactive',
        ]);

        $updateData = [
            'name' => $request->name,
            'email' => $request->email,
            'role_id' => $request->role_id,
            'warehouse_id' => $request->warehouse_id,
            'is_active' => $request->status === 'active',
            'status' => $request->status,
        ];

        if ($request->filled('password')) {
            $updateData['password'] = Hash::make($request->password);
        }

        $user->update($updateData);

        if ($request->status !== 'active') {
            $user->tokens()->delete();
        }

        return response()->json([
            'status' => 'success',
            'message' => 'User berhasil diperbarui.',
            'data' => $user
        ], Response::HTTP_OK);
    }

    /**
     * Delete a user
     */
    public function deleteUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'User berhasil dihapus.'
        ], Response::HTTP_OK);
    }

    /**
     * Activate a user
     */
    public function activateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->update([
            'status' => 'active',
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => "User {$user->name} berhasil diaktifkan."
        ], Response::HTTP_OK);
    }

    /**
     * Deactivate a user
     */
    public function deactivateUser(Request $request, $id)
    {
        $user = User::findOrFail($id);

        if ($user->id === $request->user()->id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Anda tidak dapat menonaktifkan akun Anda sendiri.'
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->update([
            'status' => 'inactive',
            'is_active' => false,
        ]);

        $user->tokens()->delete();

        return response()->json([
            'status' => 'success',
            'message' => "User {$user->name} berhasil dinonaktifkan."
        ], Response::HTTP_OK);
    }

    /**
     * Reject a user registration
     */
    public function rejectUser(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Pendaftaran user berhasil ditolak dan akun dihapus.'
        ], Response::HTTP_OK);
    }

    /**
     * Create a warehouse
     */
    public function createWarehouse(Request $request)
    {
        $request->validate([
            'warehouse_name' => 'required|string|max:255',
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'capacity' => 'required|integer|min:0',
            'pic_id' => 'nullable|exists:users,id',
            'status' => 'required|string|in:active,maintenance,inactive',
        ]);

        $warehouse = Warehouse::create([
            'warehouse_name' => $request->warehouse_name,
            'address' => $request->address,
            'city' => $request->city,
            'capacity' => $request->capacity,
            'pic_id' => $request->pic_id,
            'is_active' => $request->status === 'active',
            'status' => $request->status,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Warehouse berhasil ditambahkan.',
            'data' => $warehouse
        ], Response::HTTP_CREATED);
    }

    /**
     * Update a warehouse
     */
    public function updateWarehouse(Request $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);

        $request->validate([
            'warehouse_name' => 'required|string|max:255',
            'address' => 'required|string',
            'city' => 'required|string|max:255',
            'capacity' => 'required|integer|min:0',
            'pic_id' => 'nullable|exists:users,id',
            'status' => 'required|string|in:active,maintenance,inactive',
        ]);

        $warehouse->update([
            'warehouse_name' => $request->warehouse_name,
            'address' => $request->address,
            'city' => $request->city,
            'capacity' => $request->capacity,
            'pic_id' => $request->pic_id,
            'is_active' => $request->status === 'active',
            'status' => $request->status,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Warehouse berhasil diperbarui.',
            'data' => $warehouse
        ], Response::HTTP_OK);
    }

    /**
     * Delete a warehouse
     */
    public function deleteWarehouse(Request $request, $id)
    {
        $warehouse = Warehouse::findOrFail($id);
        $warehouse->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Warehouse berhasil dihapus.'
        ], Response::HTTP_OK);
    }

    /**
     * List all Goods Receipts with filtering
     */
    public function goodsReceipts(Request $request)
    {
        $query = GoodsReceipt::with(['warehouse', 'vendor', 'items', 'receiver']);

        if ($request->filled('warehouse_id')) {
            $query->where('warehouse_id', $request->warehouse_id);
        }

        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where(function ($q) use ($search) {
                $q->where('gr_number', 'like', $search)
                  ->orWhereHas('vendor', function ($vq) use ($search) {
                      $vq->where('vendor_name', 'like', $search);
                  });
            });
        }

        $allGR = $query->orderBy('receipt_date', 'desc')->get();

        $mappedGR = $allGR->map(function ($gr) {
            return [
                'gr_id' => $gr->gr_id,
                'gr_number' => $gr->gr_number,
                'receipt_date' => $gr->receipt_date->format('Y-m-d'),
                'warehouse_id' => $gr->warehouse_id,
                'warehouse_name' => $gr->warehouse ? $gr->warehouse->warehouse_name : 'N/A',
                'vendor_name' => $gr->vendor ? $gr->vendor->vendor_name : 'N/A',
                'items_count' => $gr->items->count(),
                'received_by' => $gr->receiver ? $gr->receiver->name : 'N/A',
                'status' => $this->getGRStatus($gr),
                'notes' => $gr->notes,
            ];
        });

        // Filter status on mapped collection if status filter is applied
        if ($request->filled('status') && $request->status !== 'All Status' && $request->status !== 'Semua Status') {
            $targetStatus = $request->status;
            // Translate status label mapping
            $mappedGR = $mappedGR->filter(function ($item) use ($targetStatus) {
                return strtolower($item['status']) === strtolower($targetStatus);
            })->values();
        }

        return response()->json([
            'status' => 'success',
            'data' => $mappedGR
        ], Response::HTTP_OK);
    }

    /**
     * Update a Goods Receipt (specifically status/notes)
     */
    public function updateGoodsReceipt(Request $request, $id)
    {
        $gr = GoodsReceipt::findOrFail($id);

        $request->validate([
            'notes' => 'nullable|string',
            'status' => 'required|string|in:Completed,Pending QC,Partial,Rejected',
        ]);

        // If updating notes
        $gr->update([
            'notes' => $request->notes
        ]);

        // If status is updated, we map it back to items qc_status
        $qcStatus = 'pending';
        if ($request->status === 'Completed') {
            $qcStatus = 'passed';
        } elseif ($request->status === 'Rejected') {
            $qcStatus = 'rejected';
        } elseif ($request->status === 'Partial') {
            $qcStatus = 'partial';
        }

        foreach ($gr->items as $item) {
            $item->update([
                'qc_status' => $qcStatus
            ]);
        }

        return response()->json([
            'status' => 'success',
            'message' => 'Status Goods Receipt berhasil diperbarui.'
        ], Response::HTTP_OK);
    }

    // --- Products CRUD ---
    public function products(Request $request)
    {
        $query = Product::with('category');
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where('product_name', 'like', $search)
                  ->orWhere('internal_code', 'like', $search);
        }
        if ($request->filled('category_id')) {
            $query->where('category_id', $request->category_id);
        }
        $products = $query->orderBy('product_name', 'asc')->get();
        return response()->json(['status' => 'success', 'data' => $products], Response::HTTP_OK);
    }

    public function storeProduct(Request $request)
    {
        $data = $request->validate([
            'product_name' => 'required|string|max:255',
            'internal_code' => 'required|string|max:255|unique:products,internal_code',
            'category_id' => 'required|exists:product_categories,category_id',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $product = Product::create($data);
        return response()->json(['status' => 'success', 'data' => $product], Response::HTTP_CREATED);
    }

    public function updateProduct(Request $request, $id)
    {
        $product = Product::findOrFail($id);
        $data = $request->validate([
            'product_name' => 'required|string|max:255',
            'internal_code' => 'required|string|max:255|unique:products,internal_code,' . $id . ',product_id',
            'category_id' => 'required|exists:product_categories,category_id',
            'unit' => 'required|string|max:50',
            'min_stock' => 'required|integer|min:0',
            'description' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $product->update($data);
        return response()->json(['status' => 'success', 'data' => $product], Response::HTTP_OK);
    }

    public function destroyProduct($id)
    {
        $product = Product::findOrFail($id);
        $product->delete();
        return response()->json(['status' => 'success', 'message' => 'Produk berhasil dihapus.'], Response::HTTP_OK);
    }

    // --- Product Categories CRUD ---
    public function categories()
    {
        $categories = ProductCategory::orderBy('category_name', 'asc')->get();
        return response()->json(['status' => 'success', 'data' => $categories], Response::HTTP_OK);
    }

    public function storeCategory(Request $request)
    {
        $data = $request->validate([
            'category_name' => 'required|string|max:255|unique:product_categories,category_name',
            'description' => 'nullable|string',
        ]);
        $category = ProductCategory::create($data);
        return response()->json(['status' => 'success', 'data' => $category], Response::HTTP_CREATED);
    }

    public function updateCategory(Request $request, $id)
    {
        $category = ProductCategory::findOrFail($id);
        $data = $request->validate([
            'category_name' => 'required|string|max:255|unique:product_categories,category_name,' . $id . ',category_id',
            'description' => 'nullable|string',
        ]);
        $category->update($data);
        return response()->json(['status' => 'success', 'data' => $category], Response::HTTP_OK);
    }

    public function destroyCategory($id)
    {
        $category = ProductCategory::findOrFail($id);
        $category->delete();
        return response()->json(['status' => 'success', 'message' => 'Kategori berhasil dihapus.'], Response::HTTP_OK);
    }

    // --- Vendors CRUD ---
    public function vendors()
    {
        $vendors = Vendor::orderBy('vendor_name', 'asc')->get();
        return response()->json(['status' => 'success', 'data' => $vendors], Response::HTTP_OK);
    }

    public function storeVendor(Request $request)
    {
        $data = $request->validate([
            'vendor_name' => 'required|string|max:255|unique:vendors,vendor_name',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $vendor = Vendor::create($data);
        return response()->json(['status' => 'success', 'data' => $vendor], Response::HTTP_CREATED);
    }

    public function updateVendor(Request $request, $id)
    {
        $vendor = Vendor::findOrFail($id);
        $data = $request->validate([
            'vendor_name' => 'required|string|max:255|unique:vendors,vendor_name,' . $id . ',vendor_id',
            'contact_person' => 'nullable|string|max:255',
            'phone' => 'nullable|string|max:255',
            'email' => 'nullable|email|max:255',
            'address' => 'nullable|string',
            'is_active' => 'sometimes|boolean',
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $vendor->update($data);
        return response()->json(['status' => 'success', 'data' => $vendor], Response::HTTP_OK);
    }

    public function destroyVendor($id)
    {
        $vendor = Vendor::findOrFail($id);
        $vendor->delete();
        return response()->json(['status' => 'success', 'message' => 'Vendor berhasil dihapus.'], Response::HTTP_OK);
    }

    // --- Departments CRUD ---
    public function departments()
    {
        $departments = Department::orderBy('department_name', 'asc')->get();
        return response()->json(['status' => 'success', 'data' => $departments], Response::HTTP_OK);
    }

    public function storeDepartment(Request $request)
    {
        $data = $request->validate([
            'department_name' => 'required|string|max:255|unique:departments,department_name',
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $department = Department::create($data);
        return response()->json(['status' => 'success', 'data' => $department], Response::HTTP_CREATED);
    }

    public function updateDepartment(Request $request, $id)
    {
        $department = Department::findOrFail($id);
        $data = $request->validate([
            'department_name' => 'required|string|max:255|unique:departments,department_name,' . $id . ',department_id',
            'head_name' => 'nullable|string|max:255',
            'is_active' => 'sometimes|boolean',
        ]);
        if ($request->has('is_active')) {
            $data['is_active'] = filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN);
        }
        $department->update($data);
        return response()->json(['status' => 'success', 'data' => $department], Response::HTTP_OK);
    }

    public function destroyDepartment($id)
    {
        $department = Department::findOrFail($id);
        $department->delete();
        return response()->json(['status' => 'success', 'message' => 'Departemen berhasil dihapus.'], Response::HTTP_OK);
    }

    // --- Audit Logs ---
    public function auditLogs(Request $request)
    {
        $query = ActivityLog::with('user.role');
        if ($request->filled('search')) {
            $search = '%' . $request->search . '%';
            $query->where('action', 'like', $search)
                  ->orWhere('description', 'like', $search)
                  ->orWhereHas('user', function ($q) use ($search) {
                      $q->where('name', 'like', $search);
                  });
        }
        $logs = $query->orderBy('created_at', 'desc')->limit(100)->get();
        return response()->json(['status' => 'success', 'data' => $logs], Response::HTTP_OK);
    }
}
