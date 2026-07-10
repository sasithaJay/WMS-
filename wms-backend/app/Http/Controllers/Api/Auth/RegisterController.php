<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuthorizedContact;
use App\Models\Organization;
use App\Models\Role;
use App\Models\Section;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;

class RegisterController extends Controller
{
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'account_type' => [
                'required',
                Rule::in([
                    'STAFF',
                    'INSTITUTION',
                    'DS_OFFICE',
                ]),
            ],

            'username' => [
                'required',
                'string',
                'min:4',
                'max:50',
                'unique:users,username',
            ],

            'email' => [
                'required',
                'email',
                'max:255',
                'unique:users,email',
            ],

            'password' => [
                'required',
                'confirmed',
                Password::min(8),
            ],
        ]);

        return match ($request->account_type) {
            'STAFF' => $this->registerStaff($request),

            'INSTITUTION' => $this->registerOrganization(
                $request,
                'INSTITUTION'
            ),

            'DS_OFFICE' => $this->registerOrganization(
                $request,
                'DS_OFFICE'
            ),
        };
    }

    // private function registerStaff(Request $request): JsonResponse
    //     {
    //         $validated = $request->validate([
    //             'division_id' => [
    //                 'required',
    //                 Rule::exists('divisions', 'id')
    //                     ->where('is_active', true),
    //             ],

    //             // 'section_id' => [
    //             //     'required',
    //             //     Rule::exists('sections', 'id')
    //             //         ->where('is_active', true),
    //             // ],

    //             'role_id' => [
    //                 'required',
    //                 Rule::exists('roles', 'id')
    //                     ->where('is_active', true),
    //             ],

    //             'full_name' => [
    //                 'required',
    //                 'string',
    //                 'max:255',
    //             ],

    //             'nic_number' => [
    //                 'required',
    //                 'string',
    //                 'max:20',
    //                 'unique:staff_profiles,nic_number',
    //             ],

    //             'phone' => [
    //                 'required',
    //                 'string',
    //                 'max:20',
    //             ],

    //             'employee_number' => [
    //                 'required',
    //                 'string',
    //                 'max:50',
    //                 'unique:staff_profiles,employee_number',
    //             ],
    //         ]);

    //         $role = Role::findOrFail($validated['role_id']);

    //         if (in_array($role->code, [
    //             'COMMISSIONER',
    //             'ADMIN',
    //         ])) {
    //             return response()->json([
    //                 'message' => 'Registration is not allowed for this role.',
    //             ], 422);
    //         }

    //         $section = Section::findOrFail(
    //             $validated['section_id']
    //         );

    //         if (
    //             $section->division_id
    //             !== (int) $validated['division_id']
    //         ) {
    //             return response()->json([
    //                 'message' =>
    //                     'The selected section does not belong to the selected division.',
    //             ], 422);
    //         }

    //         $user = DB::transaction(function () use (
    //             $request,
    //             $validated
    //         ) {
    //             $user = User::create([
    //                 'username' => $request->username,
    //                 'email' => $request->email,
    //                 'password' => $request->password,
    //                 'account_type' => 'STAFF',
    //                 'account_status' => 'PENDING',
    //             ]);

    //             StaffProfile::create([
    //                 'user_id' => $user->id,
    //                 'division_id' => $validated['division_id'],
    //                 'section_id' => $validated['section_id'],
    //                 'role_id' => $validated['role_id'],
    //                 'full_name' => $validated['full_name'],
    //                 'nic_number' => $validated['nic_number'],
    //                 'phone' => $validated['phone'],
    //                 'employee_number' =>
    //                     $validated['employee_number'],
    //             ]);

    //             return $user;
    //         });

    //         return response()->json([
    //             'message' =>
    //                 'Staff registration successful. Your account is awaiting approval.',

    //             'user' => [
    //                 'id' => $user->id,
    //                 'username' => $user->username,
    //                 'email' => $user->email,
    //                 'account_type' => $user->account_type,
    //                 'account_status' => $user->account_status,
    //             ],
    //         ], 201);
    //     }

    private function registerStaff(Request $request): JsonResponse
    {
        /*
        |--------------------------------------------------------------------------
        | Validate Common Staff Fields
        |--------------------------------------------------------------------------
        */

        $validated = $request->validate([
            'division_id' => [
                'required',
                Rule::exists('divisions', 'id')
                    ->where('is_active', true),
            ],

            'role_id' => [
                'required',
                Rule::exists('roles', 'id')
                    ->where('is_active', true),
            ],

            'full_name' => [
                'required',
                'string',
                'max:255',
            ],

            'nic_number' => [
                'required',
                'string',
                'max:20',
                'unique:staff_profiles,nic_number',
            ],

            'phone' => [
                'required',
                'string',
                'max:20',
            ],

            'employee_number' => [
                'required',
                'string',
                'max:50',
                'unique:staff_profiles,employee_number',
            ],
        ]);

        /*
        |--------------------------------------------------------------------------
        | Get Selected Role
        |--------------------------------------------------------------------------
        */

        $role = Role::findOrFail(
            $validated['role_id']
        );

        /*
        |--------------------------------------------------------------------------
        | Block Public Registration For Restricted Roles
        |--------------------------------------------------------------------------
        */

        if (in_array(
            $role->code,
            [
                'COMMISSIONER',
                'ADMIN',
            ],
            true
        )) {
            return response()->json([
                'message' =>
                    'Registration is not allowed for this role.',
            ], 422);
        }

        /*
        |--------------------------------------------------------------------------
        | Roles Without A Section
        |--------------------------------------------------------------------------
        */

        $sectionlessRoles = [
            'ASSISTANT_COMMISSIONER',
            'ASSISTANT_DIRECTOR',
            'ADMINISTRATIVE_OFFICER',
            'ACCOUNTANT',
        ];

        /*
        |--------------------------------------------------------------------------
        | Default Section To Null
        |--------------------------------------------------------------------------
        */

        $sectionId = null;

        /*
        |--------------------------------------------------------------------------
        | Validate Section Only For Section-Based Roles
        |--------------------------------------------------------------------------
        */

        if (! in_array(
            $role->code,
            $sectionlessRoles,
            true
        )) {
            $sectionValidated = $request->validate([
                'section_id' => [
                    'required',
                    Rule::exists('sections', 'id')
                        ->where('is_active', true),
                ],
            ]);

            $section = Section::findOrFail(
                $sectionValidated['section_id']
            );

            /*
            |--------------------------------------------------------------------------
            | Check Section Belongs To Selected Division
            |--------------------------------------------------------------------------
            */

            if (
                $section->division_id
                !== (int) $validated['division_id']
            ) {
                return response()->json([
                    'message' =>
                        'The selected section does not belong to the selected division.',
                ], 422);
            }

            $sectionId = $section->id;
        }

        /*
        |--------------------------------------------------------------------------
        | Create User And Staff Profile
        |--------------------------------------------------------------------------
        */

        $user = DB::transaction(function () use (
            $request,
            $validated,
            $sectionId
        ) {
            $user = User::create([
                'username' =>
                    $request->username,

                'email' =>
                    $request->email,

                'password' =>
                    $request->password,

                'account_type' =>
                    'STAFF',

                'account_status' =>
                    'PENDING',
            ]);

            StaffProfile::create([
                'user_id' =>
                    $user->id,

                'division_id' =>
                    $validated['division_id'],

                'section_id' =>
                    $sectionId,

                'role_id' =>
                    $validated['role_id'],

                'full_name' =>
                    $validated['full_name'],

                'nic_number' =>
                    $validated['nic_number'],

                'phone' =>
                    $validated['phone'],

                'employee_number' =>
                    $validated['employee_number'],
            ]);

            return $user;
        });

        return response()->json([
            'message' =>
                'Staff registration successful. Your account is awaiting approval.',

            'user' => [
                'id' =>
                    $user->id,

                'username' =>
                    $user->username,

                'email' =>
                    $user->email,

                'account_type' =>
                    $user->account_type,

                'account_status' =>
                    $user->account_status,
            ],
        ], 201);
    }

    private function registerOrganization(
        Request $request,
        string $organizationKind
        ): JsonResponse {
            $rules = [
                'division_id' => [
                    'required',
                    Rule::exists('divisions', 'id')
                        ->where('is_active', true),
                ],

                'organization_name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'address' => [
                    'required',
                    'string',
                ],

                'contact_number' => [
                    'required',
                    'string',
                    'max:20',
                ],

                'contact_person_name' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'contact_person_designation' => [
                    'required',
                    'string',
                    'max:255',
                ],

                'contact_person_nic' => [
                    'required',
                    'string',
                    'max:20',
                    'unique:authorized_contacts,nic_number',
                ],

                'contact_person_phone' => [
                    'required',
                    'string',
                    'max:20',
                ],

                'contact_person_email' => [
                    'required',
                    'email',
                    'max:255',
                ],
            ];

            if ($organizationKind === 'INSTITUTION') {
                $rules['institution_type_id'] = [
                    'required',
                    Rule::exists('institution_types', 'id')
                        ->where('is_active', true),
                ];

                $rules['licence_number'] = [
                    'required',
                    'string',
                    'max:100',
                    'unique:organizations,licence_number',
                ];
            }

            $validated = $request->validate($rules);

            $user = DB::transaction(function () use (
                $request,
                $validated,
                $organizationKind
            ) {
                $user = User::create([
                    'username' => $request->username,
                    'email' => $request->email,
                    'password' => $request->password,
                    'account_type' => $organizationKind,
                    'account_status' => 'PENDING',
                ]);

                $organization = Organization::create([
                    'user_id' => $user->id,
                    'division_id' => $validated['division_id'],

                    'organization_kind' =>
                        $organizationKind,

                    'name' =>
                        $validated['organization_name'],

                    'institution_type_id' =>
                        $organizationKind === 'INSTITUTION'
                            ? $validated['institution_type_id']
                            : null,

                    'licence_number' =>
                        $organizationKind === 'INSTITUTION'
                            ? $validated['licence_number']
                            : null,

                    'address' => $validated['address'],

                    'contact_number' =>
                        $validated['contact_number'],
                ]);

                AuthorizedContact::create([
                    'organization_id' => $organization->id,

                    'full_name' =>
                        $validated['contact_person_name'],

                    'designation' =>
                        $validated[
                            'contact_person_designation'
                        ],

                    'nic_number' =>
                        $validated['contact_person_nic'],

                    'phone' =>
                        $validated['contact_person_phone'],

                    'email' =>
                        $validated['contact_person_email'],

                    'is_primary' => true,
                ]);

                return $user;
            });

            return response()->json([
                'message' =>
                    'Registration successful. Your account is awaiting approval.',

                'user' => [
                    'id' => $user->id,
                    'username' => $user->username,
                    'email' => $user->email,
                    'account_type' => $user->account_type,
                    'account_status' => $user->account_status,
                ],
            ], 201);
        }
}    