<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateWorkerRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        $worker = $this->route('worker');

        return [
            'internal_number' => ['sometimes', 'string', 'max:50', Rule::unique('workers', 'internal_number')->ignore($worker)],
            'full_name_ar' => ['sometimes', 'string', 'max:255'],
            'full_name_en' => ['sometimes', 'string', 'max:255'],
            'full_name_am' => ['sometimes', 'string', 'max:255'],
            'date_of_birth' => ['sometimes', 'date'],
            'gender' => ['sometimes', 'in:male,female'],
            'passport_number' => ['sometimes', 'string', 'max:50', Rule::unique('workers', 'passport_number')->ignore($worker)],
            'passport_expiry' => ['sometimes', 'date'],
            'nationality_id' => ['sometimes', 'integer', 'exists:countries,id'],
            'worker_type_id' => ['sometimes', 'integer', 'exists:worker_types,id'],
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
