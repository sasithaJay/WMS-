<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        $this->call([
            InitialDataSeeder::class,
            RoleSeeder::class,
            CommissionerSeeder::class,
            InstitutionTypeSeeder::class,
            PermissionSeeder::class,
            RolePermissionSeeder::class,
            InventoryReferenceSeeder::class,
            ApprovalRuleSeeder::class,
            RecommendationRuleSeeder::class,
            DsOfficeSeeder::class,
            AdminSeeder::class,
        ]);
    }
}
