<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RegisterAgencyRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'agency_name' => ['required', 'string', 'max:255'],
            'license_number' => ['required', 'string', 'max:100', 'unique:agencies,license_number'],
            'country' => ['nullable', 'string', 'max:100'],
            'city' => ['nullable', 'string', 'max:100'],
            'agency_phone' => ['nullable', 'string', 'max:30'],
            'agency_email' => ['nullable', 'email', 'max:255'],

            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'phone' => ['nullable', 'string', 'max:30'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'position' => ['nullable', 'string', 'max:100'],
        ];
    }
}
