<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreWorkerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'internal_number' => ['required', 'string', 'max:50', 'unique:workers,internal_number'],
            'full_name_ar' => ['required', 'string', 'max:255'],
            'full_name_en' => ['required', 'string', 'max:255'],
            'full_name_am' => ['required', 'string', 'max:255'],
            'date_of_birth' => ['required', 'date'],
            'gender' => ['required', 'in:male,female'],
            'passport_number' => ['required', 'string', 'max:50', 'unique:workers,passport_number'],
            'passport_expiry' => ['required', 'date'],
            'nationality_id' => ['required', 'integer', 'exists:countries,id'],
            'worker_type_id' => ['required', 'integer', 'exists:worker_types,id'],
            'experience_years' => ['nullable', 'integer', 'min:0'],
            'height_cm' => ['nullable', 'numeric'],
            'weight_kg' => ['nullable', 'numeric'],
            'religion' => ['nullable', 'in:muslim,christian,other'],
            'marital_status' => ['nullable', 'in:single,married,divorced,widowed'],
            'number_of_children' => ['nullable', 'integer', 'min:0'],
            'agency_id' => ['nullable', 'integer', 'exists:agencies,id'],
            'current_recruitment_stage_id' => ['nullable', 'integer', 'exists:recruitment_stages,id'],
            'is_published' => ['nullable', 'boolean'],
            'is_active' => ['nullable', 'boolean'],
            'languages' => ['nullable', 'array'],
            'languages.*.language_id' => ['required_with:languages', 'integer', 'exists:languages,id'],
            'languages.*.proficiency' => ['nullable', 'string', 'max:50'],
            'skills' => ['nullable', 'array'],
            'skills.*.skill_id' => ['required_with:skills', 'integer', 'exists:skills,id'],
            'skills.*.level' => ['nullable', 'string', 'max:50'],
        ];
    }
}
