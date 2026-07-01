<?php

namespace Database\Seeders;

use App\Models\Agency;
use App\Models\AgencyUser;
use App\Models\Country;
use App\Models\Customer;
use App\Models\Language;
use App\Models\Role;
use App\Models\Skill;
use App\Models\User;
use App\Models\Worker;
use App\Models\WorkerType;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

/**
 * Reproducible demo data so a freshly migrated database is immediately usable
 * for local development and end-to-end testing: a verified Saudi agency with a
 * primary-contact login, an individual customer login, and a handful of
 * published, available workers.
 */
class DemoSeeder extends Seeder
{
    public function run(): void
    {
        $nationality = Country::query()->orderBy('id')->first();
        $workerType = WorkerType::query()->orderBy('id')->first();

        if (! $nationality || ! $workerType) {
            return; // master data not seeded yet
        }

        $this->seedAgency();
        $this->seedCustomer();
        $this->seedWorkers($nationality->id, $workerType->id);
    }

    private function seedAgency(): void
    {
        $agency = Agency::firstOrCreate(
            ['license_number' => 'DEMO-1001'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Riyadh Trusted Recruitment',
                'country' => 'SA',
                'city' => 'Riyadh',
                'phone' => '+966500000001',
                'email' => 'agency@demo.test',
                'rating' => 4.7,
                'completed_cases' => 128,
                'is_verified' => true,
                'is_active' => true,
            ]
        );

        $agencyRole = Role::where('slug', 'agency')->first();
        if ($agencyRole) {
            $user = User::firstOrCreate(
                ['email' => 'agency@demo.test'],
                [
                    'uuid' => (string) Str::uuid(),
                    'name' => 'Agency Manager',
                    'phone' => '+966500000001',
                    'password' => Hash::make('password'),
                    'role_id' => $agencyRole->id,
                ]
            );

            AgencyUser::firstOrCreate(
                ['agency_id' => $agency->id, 'user_id' => $user->id],
                ['position' => 'Manager', 'is_primary_contact' => true]
            );
        }
    }

    private function seedCustomer(): void
    {
        $customerRole = Role::where('slug', 'customer')->first();
        if (! $customerRole) {
            return;
        }

        $user = User::firstOrCreate(
            ['email' => 'customer@demo.test'],
            [
                'uuid' => (string) Str::uuid(),
                'name' => 'Demo Customer',
                'phone' => '+966512345678',
                'password' => Hash::make('password'),
                'role_id' => $customerRole->id,
            ]
        );

        Customer::firstOrCreate(
            ['user_id' => $user->id],
            ['uuid' => (string) Str::uuid(), 'country' => 'SA', 'city' => 'Jeddah']
        );
    }

    private function seedWorkers(int $nationalityId, int $workerTypeId): void
    {
        $languages = Language::query()->pluck('id')->all();
        $skills = Skill::query()->pluck('id')->all();

        $samples = [
            ['WK-1001', ['ar' => 'ماري', 'en' => 'Mary', 'am' => 'ማርያም'], '1996-03-12', 4, 18000],
            ['WK-1002', ['ar' => 'هيلين', 'en' => 'Helen', 'am' => 'ሔለን'], '1994-07-20', 6, 20000],
            ['WK-1003', ['ar' => 'سارة', 'en' => 'Sara', 'am' => 'ሳራ'], '1999-11-01', 2, 15000],
            ['WK-1004', ['ar' => 'روزا', 'en' => 'Rosa', 'am' => 'ሮዛ'], '1997-05-05', 5, 19000],
        ];

        foreach ($samples as [$number, $names, $dob, $experience, $price]) {
            $worker = Worker::firstOrCreate(
                ['internal_number' => $number],
                [
                    'uuid' => (string) Str::uuid(),
                    'full_name_ar' => $names['ar'],
                    'full_name_en' => $names['en'],
                    'full_name_am' => $names['am'],
                    'date_of_birth' => $dob,
                    'gender' => 'female',
                    'passport_number' => 'DEMO'.substr($number, 3),
                    'passport_expiry' => '2031-01-01',
                    'nationality_id' => $nationalityId,
                    'worker_type_id' => $workerTypeId,
                    'experience_years' => $experience,
                    'religion' => 'christian',
                    'marital_status' => 'single',
                    'reservation_status' => 'available',
                    'readiness_score' => 80,
                    'is_published' => true,
                    'is_active' => true,
                    'price' => $price,
                    'price_currency' => 'SAR',
                ]
            );

            if ($languages) {
                $worker->languages()->syncWithoutDetaching(
                    collect($languages)->take(2)->mapWithKeys(fn ($id) => [$id => ['proficiency' => 'intermediate']])->all()
                );
            }
            if ($skills) {
                $worker->skills()->syncWithoutDetaching(
                    collect($skills)->take(3)->mapWithKeys(fn ($id) => [$id => ['level' => 'intermediate']])->all()
                );
            }
        }
    }
}
