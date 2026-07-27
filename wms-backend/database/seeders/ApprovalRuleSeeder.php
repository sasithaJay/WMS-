<?php
// database/seeders/ApprovalRuleSeeder.php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Role;
use App\Models\RecommendationRule;
use App\Models\ApprovalRule;
use App\Models\Division;

class ApprovalRuleSeeder extends Seeder
{
    public function run(): void
    {
        $role = fn (string $code) => Role::where('code', $code)->firstOrFail()->id;
        $division = fn (string $code) => Division::where('code', $code)->firstOrFail()->id;

        $rules = [];

        // --- Commissioner's own PERSONAL request — division-specific, AO excluded ---
        $rules[] = [
            'division_id' => $division('CHILD_SERVICES'),
            'requester_role_id' => $role('COMMISSIONER'),
            'request_context' => 'PERSONAL',
            'approver_role_id' => $role('ASSISTANT_COMMISSIONER'),
            'priority' => 20,
        ];
        foreach (['ACCOUNTANT', 'ASSISTANT_DIRECTOR'] as $code) {
            $rules[] = [
                'division_id' => $division('SOCIAL_SERVICES'),
                'requester_role_id' => $role('COMMISSIONER'),
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }

        // --- AC / AD / Accountant's own PERSONAL request — Commissioner only ---
        foreach (['ASSISTANT_COMMISSIONER', 'ASSISTANT_DIRECTOR', 'ACCOUNTANT'] as $code) {
            $rules[] = [
                'requester_role_id' => $role($code),
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role('COMMISSIONER'),
                'priority' => 10,
            ];
        }

        // --- AO's own PERSONAL request — division pool minus self ---
        foreach (['COMMISSIONER', 'ASSISTANT_DIRECTOR', 'ACCOUNTANT'] as $code) {
            $rules[] = [
                'division_id' => $division('SOCIAL_SERVICES'),
                'requester_role_id' => $role('ADMINISTRATIVE_OFFICER'),
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }
        foreach (['COMMISSIONER', 'ASSISTANT_COMMISSIONER'] as $code) {
            $rules[] = [
                'division_id' => $division('CHILD_SERVICES'),
                'requester_role_id' => $role('ADMINISTRATIVE_OFFICER'),
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }

        // --- Store Keeper — full division pool (AO included; recommender was Section Head) ---
        foreach (['COMMISSIONER', 'ASSISTANT_DIRECTOR', 'ACCOUNTANT', 'ADMINISTRATIVE_OFFICER'] as $code) {
            $rules[] = [
                'division_id' => $division('SOCIAL_SERVICES'),
                'requester_role_id' => $role('STORE_KEEPER'),
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }
        foreach (['COMMISSIONER', 'ASSISTANT_COMMISSIONER', 'ADMINISTRATIVE_OFFICER'] as $code) {
            $rules[] = [
                'division_id' => $division('CHILD_SERVICES'),
                'requester_role_id' => $role('STORE_KEEPER'),
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }

        // --- Development Officer & Other Officer — same full division pool as Store Keeper ---
        foreach (['DEVELOPMENT_OFFICER', 'OTHER_OFFICER'] as $requesterCode) {
            foreach (['COMMISSIONER', 'ASSISTANT_DIRECTOR', 'ACCOUNTANT', 'ADMINISTRATIVE_OFFICER'] as $code) {
                $rules[] = [
                    'division_id' => $division('SOCIAL_SERVICES'),
                    'requester_role_id' => $role($requesterCode),
                    'request_context' => 'PERSONAL',
                    'approver_role_id' => $role($code),
                    'priority' => 20,
                ];
            }
            foreach (['COMMISSIONER', 'ASSISTANT_COMMISSIONER', 'ADMINISTRATIVE_OFFICER'] as $code) {
                $rules[] = [
                    'division_id' => $division('CHILD_SERVICES'),
                    'requester_role_id' => $role($requesterCode),
                    'request_context' => 'PERSONAL',
                    'approver_role_id' => $role($code),
                    'priority' => 20,
                ];
            }
        }

        // --- Section Head PERSONAL — division pool minus AO (AO was the recommender) ---
        foreach (['COMMISSIONER', 'ASSISTANT_DIRECTOR', 'ACCOUNTANT'] as $code) {
            $rules[] = [
                'division_id' => $division('SOCIAL_SERVICES'),
                'requester_role_id' => $role('SECTION_HEAD'),
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }
        foreach (['COMMISSIONER', 'ASSISTANT_COMMISSIONER'] as $code) {
            $rules[] = [
                'division_id' => $division('CHILD_SERVICES'),
                'requester_role_id' => $role('SECTION_HEAD'),
                'request_context' => 'PERSONAL',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }

        // --- Section Head SECTION_COMMON — same shape as PERSONAL (AO excluded) ---
        foreach (['COMMISSIONER', 'ASSISTANT_DIRECTOR', 'ACCOUNTANT'] as $code) {
            $rules[] = [
                'division_id' => $division('SOCIAL_SERVICES'),
                'requester_role_id' => $role('SECTION_HEAD'),
                'request_context' => 'SECTION_COMMON',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }
        foreach (['COMMISSIONER', 'ASSISTANT_COMMISSIONER'] as $code) {
            $rules[] = [
                'division_id' => $division('CHILD_SERVICES'),
                'requester_role_id' => $role('SECTION_HEAD'),
                'request_context' => 'SECTION_COMMON',
                'approver_role_id' => $role($code),
                'priority' => 20,
            ];
        }

        // --- Institutions — unchanged ---
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

        // --- DS Offices — same pool as Institutions (AO excluded, since AO effectively originated it) ---
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