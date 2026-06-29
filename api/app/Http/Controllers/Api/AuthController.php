<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Concerns\ApiResponse;
use App\Http\Controllers\Controller;
use App\Http\Requests\LoginRequest;
use App\Http\Requests\RegisterAgencyRequest;
use App\Http\Requests\RegisterCustomerRequest;
use App\Models\Agency;
use App\Models\AgencyUser;
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

    public function registerAgency(RegisterAgencyRequest $request)
    {
        $role = Role::where('slug', 'agency')->firstOrFail();

        $user = DB::transaction(function () use ($request, $role) {
            $agency = Agency::create([
                'uuid' => (string) Str::uuid(),
                'name' => $request->string('agency_name'),
                'license_number' => $request->string('license_number'),
                'country' => $request->string('country') ?: null,
                'city' => $request->string('city') ?: null,
                'phone' => $request->string('agency_phone') ?: null,
                'email' => $request->string('agency_email') ?: null,
                'is_verified' => false,
                'is_active' => true,
            ]);

            $user = User::create([
                'uuid' => (string) Str::uuid(),
                'name' => $request->string('name'),
                'email' => $request->string('email'),
                'phone' => $request->string('phone') ?: null,
                'password' => $request->string('password'),
                'role_id' => $role->id,
            ]);

            AgencyUser::create([
                'agency_id' => $agency->id,
                'user_id' => $user->id,
                'position' => $request->string('position') ?: null,
                'is_primary_contact' => true,
            ]);

            return $user;
        });

        $token = $user->createToken('api')->plainTextToken;

        return $this->success([
            'user' => $user->load('role'),
            'token' => $token,
        ], 'تم إنشاء حساب المكتب بنجاح. سيتم التحقق منه قبل تفعيل كل الصلاحيات.', 201);
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
