<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\RecommendationRule;

class RecommendationRuleSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $role = fn (string $code) => Role::where('code', $code)->firstOrFail()->id;

        $rules = [
           // Regular staff (Development Officer, Other Officer) — PERSONAL request
            // → recommended by their own section's Section Head
            [
                'requester_role_id' => null, // wildcard
                'request_context' => 'PERSONAL',
                'recommender_role_id' => $role('SECTION_HEAD'),
                'priority' => 1,
            ], 

            // Section Head's own PERSONAL request → no recommendation
            [
                'requester_role_id' => $role('SECTION_HEAD'),
                'request_context' => 'PERSONAL',
                'recommender_role_id' => $role('ADMINISTRATIVE_OFFICER'),
                'priority' => 10,
            ],

            // Senior officers' own PERSONAL requests → no recommendation
            ...collect([
                'ASSISTANT_COMMISSIONER',
                'ASSISTANT_DIRECTOR',
                'ADMINISTRATIVE_OFFICER',
                'ACCOUNTANT',
                'COMMISSIONER',
            ])->map(fn ($code) => [
                'requester_role_id' => $role($code),
                'request_context' => 'PERSONAL',
                'recommender_role_id' => null,
                'priority' => 10,
            ])->all(),

            // Section Head's SECTION_COMMON (section-wide) request → recommended by AO
            [
                'requester_role_id' => $role('SECTION_HEAD'),
                'request_context' => 'SECTION_COMMON',
                'recommender_role_id' => $role('ADMINISTRATIVE_OFFICER'),
                'priority' => 10,
            ],

            // External Institutions → recommended by AO
            [
                'organization_kind' => 'INSTITUTION',
                'recommender_role_id' => $role('ADMINISTRATIVE_OFFICER'),
                'priority' => 10,
            ],

            // Divisional Secretary Offices → recommended by AO
            [
                'organization_kind' => 'DS_OFFICE',
                'recommender_role_id' => null,
                'priority' => 10,
            ],
        ];

        foreach ($rules as $rule) {
            RecommendationRule::create($rule);
        }
    }
}
