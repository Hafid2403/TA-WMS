<?php

namespace App\Http\Controllers;

use App\Models\User;
use App\Models\Role;
use App\Models\Warehouse;
use App\Models\PasswordResetRequest;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;
use Symfony\Component\HttpFoundation\Response;

class AuthController extends Controller
{
    /**
     * Authenticate user and issue API Token.
     */
    public function login(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|string',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = User::where('email', $request->email)->first();

        if (!$user || !Hash::check($request->password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Invalid email or password.',
            ], Response::HTTP_UNAUTHORIZED);
        }

        if (!$user->is_active) {
            return response()->json([
                'status' => 'error',
                'message' => 'User account is deactivated.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Load relations
        $user->load(['role', 'warehouse']);

        // Issue token
        $token = $user->createToken('wms_auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Login successful.',
            'data' => [
                'token' => $token,
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role ? $user->role->role_name : null,
                    'warehouse_id' => $user->warehouse_id,
                    'warehouse_name' => $user->warehouse ? $user->warehouse->warehouse_name : null,
                ]
            ]
        ], Response::HTTP_OK);
    }

    /**
     * Revoke current session token.
     */
    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'status' => 'success',
            'message' => 'Session logged out successfully.',
        ], Response::HTTP_OK);
    }

    /**
     * Get authenticated user profile.
     */
    public function profile(Request $request)
    {
        $user = $request->user()->load(['role', 'warehouse']);

        return response()->json([
            'status' => 'success',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'role' => $user->role ? $user->role->role_name : null,
                'warehouse_id' => $user->warehouse_id,
                'warehouse_name' => $user->warehouse ? $user->warehouse->warehouse_name : null,
            ]
        ], Response::HTTP_OK);
    }

    /**
     * Register a new user (administrative operation).
     */
    public function register(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:100',
            'email' => 'required|string|email|max:100|unique:users,email',
            'password' => 'required|string|min:6',
            'role_id' => 'required|exists:roles,role_id',
            'warehouse_id' => 'nullable|exists:warehouses,warehouse_id',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = User::create([
            'name' => $request->name,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'role_id' => $request->role_id,
            'warehouse_id' => $request->warehouse_id,
            'is_active' => true,
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'User registered successfully.',
            'data' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
        ], Response::HTTP_CREATED);
    }

    /**
     * Change password for the currently authenticated user.
     */
    public function changePassword(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:6|confirmed',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => 'Validation error.',
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = $request->user();

        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Password saat ini salah.',
            ], Response::HTTP_BAD_REQUEST);
        }

        $user->update([
            'password' => Hash::make($request->new_password)
        ]);

        \App\Helpers\ActivityLogger::log('USER_CHANGE_PASSWORD', "User {$user->name} changed their password.", $user->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Password berhasil diubah.',
        ], Response::HTTP_OK);
    }

    /**
     * Reset password of a specific user to a generated temporary password (Master-only).
     */
    public function resetPassword(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json([
                'status' => 'error',
                'message' => 'User tidak ditemukan.',
            ], Response::HTTP_NOT_FOUND);
        }

        $tempPassword = bin2hex(random_bytes(4));

        $user->update([
            'password' => Hash::make($tempPassword)
        ]);

        // Complete any pending password reset requests for this user
        PasswordResetRequest::where('user_id', $user->id)
            ->where('status', 'pending')
            ->update(['status' => 'completed']);

        $actor = $request->user();
        \App\Helpers\ActivityLogger::log('USER_RESET_PASSWORD', "Master {$actor->name} reset password for user {$user->name}.", $actor->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Password berhasil di-reset.',
            'data' => [
                'temporary_password' => $tempPassword
            ]
        ], Response::HTTP_OK);
    }

    /**
     * Submit a new password reset request (Public).
     */
    public function requestPasswordReset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'email' => 'required|email|exists:users,email',
        ], [
            'email.exists' => 'Email tidak terdaftar di sistem WMS kami.',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'status' => 'error',
                'message' => $validator->errors()->first('email'),
                'errors' => $validator->errors(),
            ], Response::HTTP_UNPROCESSABLE_ENTITY);
        }

        $user = User::where('email', $request->email)->first();

        // Prevent PIC and QC from filing password reset requests
        if (in_array($user->role, ['PIC', 'QC'])) {
            return response()->json([
                'status' => 'error',
                'message' => 'Reset password hanya dapat dilakukan langsung oleh Master Administrator. Silakan hubungi Master untuk mereset password Anda.',
            ], Response::HTTP_FORBIDDEN);
        }

        // Create or update a pending reset request
        $resetRequest = PasswordResetRequest::updateOrCreate(
            ['user_id' => $user->id, 'status' => 'pending'],
            ['email' => $request->email]
        );

        \App\Helpers\ActivityLogger::log('USER_RESET_REQUESTED', "User {$user->name} requested a password reset.", $user->id);

        return response()->json([
            'status' => 'success',
            'message' => 'Permintaan reset password berhasil diajukan! Silakan hubungi Master Administrator Anda untuk mendapatkan kredensial baru.',
        ], Response::HTTP_CREATED);
    }

    /**
     * List all pending password reset requests (Master-only).
     */
    public function listPasswordResetRequests(Request $request)
    {
        $requests = PasswordResetRequest::with(['user.role', 'user.warehouse'])
            ->where('status', 'pending')
            ->orderBy('created_at', 'desc')
            ->get();

        return response()->json([
            'status' => 'success',
            'data' => $requests
        ], Response::HTTP_OK);
    }
}
