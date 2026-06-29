<?php

namespace Database\Seeders;

use App\Models\Role;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    public function run(): void
    {
        $this->call(MasterDataSeeder::class);

        $superAdminRole = Role::where('slug', 'super_admin')->firstOrFail();

        User::factory()->create([
            'uuid' => (string) Str::uuid(),
            'name' => 'Test Admin',
            'email' => 'admin@afkanagent.com',
            'role_id' => $superAdminRole->id,
        ]);
    }
}
