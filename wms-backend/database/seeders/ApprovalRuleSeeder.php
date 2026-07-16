<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\ApprovalRule;
use App\Models\Role;
use App\Models\Division;

// database/seeders/ApprovalRuleSeeder.php

class ApprovalRuleSeeder extends Seeder
{
    public function run(): void
    {
        $role = fn (string $code) => Role::where('code', $code)->firstOrFail()->id;
        $division = fn (string $code) => Division::where('code', $code)->firstOrFail()->id;

        $rules = [];

        // --- Regular PERSONAL requests (staff, section heads, AC/AD/AO/Accountant's
        // own requests) — any one of the five senior roles can approve ---
        foreach (['COMMISSIONER', 'ASSISTANT_COMMISSIONER', 'ASSISTANT_DIRECTOR', 'ADMINISTRATIVE_OFFICER', 'ACCOUNTANT'] as $code) {
            $rules[] = [
                'requester_role_id' => null, // wildcard
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role($code),
                'priority' => 1,
            ];
        }

        // Commissioner's own PERSONAL request — auto-approved, no approval step
        $rules[] = [
            'requester_role_id' => $role('COMMISSIONER'),
            'request_context' => 'PERSONAL',
            'approver_role_id' => null,
            'priority' => 10,
        ];

        // --- Section Head's SECTION_COMMON request — Accountant, AC, AD, or
        // Commissioner (AO excluded — AO already recommended it) ---
        foreach (['ACCOUNTANT', 'ASSISTANT_COMMISSIONER', 'ASSISTANT_DIRECTOR', 'COMMISSIONER'] as $code) {
            $rules[] = [
                'requester_role_id' => $role('SECTION_HEAD'),
                'request_context' => 'SECTION_COMMON',
                'approver_role_id' => $role($code),
                'priority' => 10,
            ];
        }

        // --- External Institutions — division-specific approver set ---
        foreach (['ASSISTANT_COMMISSIONER', 'COMMISSIONER'] as $code) {
            $rules[] = [
                'division_id' => $division('CHILD_SERVICES'),
                'organization_kind' => 'INSTITUTION',
                'approver_role_id' => $role($code),
                'priority' => 10,
            ];
        }
        foreach (['ASSISTANT_DIRECTOR', 'ACCOUNTANT', 'COMMISSIONER'] as $code) {
            $rules[] = [
                'division_id' => $division('SOCIAL_SERVICES'),
                'organization_kind' => 'INSTITUTION',
                'approver_role_id' => $role($code),
                'priority' => 10,
            ];
        }

        // --- Divisional Secretary Offices — mirrors institution mapping exactly ---
        foreach (['ASSISTANT_COMMISSIONER', 'COMMISSIONER'] as $code) {
            $rules[] = [
                'division_id' => $division('CHILD_SERVICES'),
                'organization_kind' => 'DS_OFFICE',
                'approver_role_id' => $role($code),
                'priority' => 10,
            ];
        }
        foreach (['ASSISTANT_DIRECTOR', 'ACCOUNTANT', 'COMMISSIONER'] as $code) {
            $rules[] = [
                'division_id' => $division('SOCIAL_SERVICES'),
                'organization_kind' => 'DS_OFFICE',
                'approver_role_id' => $role($code),
                'priority' => 10,
            ];
        }

        foreach ($rules as $rule) {
            ApprovalRule::create($rule);
        }
    }
}
