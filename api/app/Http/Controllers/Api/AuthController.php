<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterCustomerRequest;
use App\Models\Customer;
use App\Models\Role;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    public function registerCustomer(RegisterCustomerRequest $request)
    {
        $role = Role::where('slug', 'customer')->firstOrFail();

        $user = DB::transaction(function () use ($request, $role) {
            $user = User::create([
                'uuid' => (string) Str::uuid(),
                'name' => $request->string('name'),
                'email' => $request->string('email'),
                'phone' => $request->string('phone') ?: null,
                'password' => $request->string('password'),
                'role_id' => $role->id,
            ]);

            Customer::create([
                'uuid' => (string) Str::uuid(),
                'user_id' => $user->id,
                'country' => $request->string('country') ?: null,
                'city' => $request->string('city') ?: null,
            ]);

            return $user;
        });

        $token = $user->createToken('api')->plainTextToken;

        return $this->success([
            'user' => $user->load('role'),
            'token' => $token,
        ], 'تم إنشاء الحساب بنجاح', 201);
    }

    public function login(LoginRequest $request)
    {
        $user = User::where('email', $request->string('email'))->first();

        if (! $user || ! $user->is_active || ! Auth::getProvider()->validateCredentials($user, $request->only('password'))) {
            throw ValidationException::withMessages([
                'email' => ['بيانات الدخول غير صحيحة.'],
            ]);
        }

        $token = $user->createToken('api')->plainTextToken;

        return $this->success([
            'user' => $user->load('role'),
            'token' => $token,
        ], 'تم تسجيل الدخول بنجاح');
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();

        return $this->success(null, 'تم تسجيل الخروج');
    }

    public function me(Request $request)
    {
        return $this->success($request->user()->load('role'));
    }
}
