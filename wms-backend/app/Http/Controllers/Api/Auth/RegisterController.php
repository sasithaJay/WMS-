<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\AuthorizedContact;
use App\Models\Organization;
use App\Models\Role;
use App\Models\Section;
use App\Models\StaffProfile;
use App\Models\User;
use App\Models\Institution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\Rules\Password;
use App\Notifications\NewAccountPendingApproval;
use App\Notifications\Channels\SmsChannel;
use App\Models\PhoneVerification;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Log;

class RegisterController extends Controller
{

    private function notifyApprovers(User $newUser): void
    {
        $approverRoleIds = Role::whereIn('code', ['COMMISSIONER', 'ADMIN'])->pluck('id');

        $approvers = User::whereHas('staffProfile', fn ($q) =>
            $q->whereIn('role_id', $approverRoleIds)
        )->get();

        foreach ($approvers as $approver) {
            $approver->notify(new NewAccountPendingApproval($newUser));
        }
    }

    public function register(Request $request): JsonResponse
    {
        $request->validate(['verification_token' => ['required', 'string']]);
        $verification = PhoneVerification::where('verification_token', $request->verification_token)
            ->whereNotNull('verified_at')->whereNull('token_used_at')->first();
        abort_unless($verification, 422, 'Phone verification is required before registration.');
        $request->merge(json_decode(Crypt::decryptString($verification->registration_payload), true, 512, JSON_THROW_ON_ERROR));
        $request->validate([
            'account_type' => ['required', Rule::in(['STAFF', 'INSTITUTION', 'DS_OFFICE'])],
            'username' => ['required', 'string', 'min:4', 'max:50', 'unique:users,username'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'confirmed', Password::min(8)],
        ]);

        $response = match ($request->account_type) {
            'STAFF' => $this->registerStaff($request),
            'INSTITUTION' => $this->registerOrganization($request, 'INSTITUTION'),
            'DS_OFFICE' => $this->registerOrganization($request, 'DS_OFFICE'),
        };
        $verification->update(['token_used_at' => now()]);
        return $response;
    }

    public function requestOtp(Request $request): JsonResponse
    {
        \Log::info('REQUEST OTP ENDPOINT HIT', [
    'data' => $request->except(['password', 'password_confirmation']),
]);

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
            $phone = $request->account_type === 'STAFF'
                ? $request->input('phone')
                : $request->input('contact_person_phone');

            $request->validate([
                'account_type' => ['required', Rule::in(['STAFF', 'INSTITUTION', 'DS_OFFICE'])],
                'phone' => ['required_if:account_type,STAFF', 'string', 'max:20'],
                'contact_person_phone' => ['required_unless:account_type,STAFF', 'string', 'max:20'],
            ]);

            $otp = (string) random_int(100000, 999999);
            $verification = PhoneVerification::create([
                'phone' => $phone,
                'account_type' => $request->account_type,
                'registration_payload' => Crypt::encryptString(json_encode($request->except(['verification_token']), JSON_THROW_ON_ERROR)),
                'otp_hash' => Hash::make($otp),
                'expires_at' => now()->addMinutes(10),
            ]);

            $this->sendOtp($phone, $otp);

            return response()->json([
                'message' => 'A verification code was sent to the phone number.',
                'verification_id' => $verification->id,
                'phone' => substr($phone, 0, 3) . '****' . substr($phone, -2),
            ], 201);
        }

        public function verifyOtp(Request $request): JsonResponse
        {
            $data = $request->validate([
                'verification_id' => ['required', 'integer', 'exists:phone_verifications,id'],
                'otp' => ['required', 'digits:6'],
            ]);
            $verification = PhoneVerification::findOrFail($data['verification_id']);
            abort_if($verification->verified_at || $verification->token_used_at || $verification->expires_at->isPast() || $verification->attempts >= 5, 422, 'This verification code is no longer valid.');
            if (! Hash::check($data['otp'], $verification->otp_hash)) {
                $verification->increment('attempts');
                abort(422, 'The verification code is incorrect.');
            }
            $verification->update([
                'verified_at' => now(),
                'verification_token' => Str::random(64),
            ]);
            return response()->json(['message' => 'Phone verified successfully.', 'verification_token' => $verification->verification_token]);
        }

        private function sendOtp(string $phone, string $otp): void
        {
            \Log::info('OTP SEND STARTED', [
                'phone' => $phone,
                'otp' => $otp,
            ]);

            $message = "WMS verification code: {$otp}. It expires in 10 minutes.";

            $sent = app(SmsChannel::class)->sendToPhone(
                $phone,
                $message
            );

            \Log::info('OTP SMS RESULT', [
                'phone' => $phone,
                'sent' => $sent,
            ]);

            if (! $sent) {
                throw new \RuntimeException(
                    'Unable to send the verification code. Please try again.'
                );
            }
        } 

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

            'salary_number' => [
                'required',
                'string',
                'max:50',
                'unique:staff_profiles,salary_number',
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

                'salary_number' =>
                    $validated['salary_number'],
            ]);

            return $user;
        });

        $this->notifyApprovers($user);

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
            // Selected from the seeded institutions list — division and name
            // come from this record, not from client-typed input.
            $rules['institution_id'] = [
                'required',
                Rule::exists('institutions', 'id')
                    ->where('is_active', true),
            ];

            $rules['institution_type_id'] = [
                'required',
                Rule::exists('institution_types', 'id')
                    ->where('is_active', true),
            ];

        } else {
            // DS_OFFICE — division is chosen freely (once per division per year,
            // per your earlier business rule), organization name stays free text
            // since DS offices aren't a fixed seeded list.
            $rules['division_id'] = [
                'required',
                Rule::exists('divisions', 'id')
                    ->where('is_active', true),
            ];

            $rules['organization_name'] = [
                'required',
                'string',
                'max:255',
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

            if ($organizationKind === 'INSTITUTION') {
                $institution = Institution::findOrFail($validated['institution_id']);

                $organization = Organization::create([
                    'user_id' => $user->id,
                    'division_id' => $institution->division_id,
                    'organization_kind' => 'INSTITUTION',
                    'name' => $institution->name_en,
                    'institution_type_id' => $validated['institution_type_id'],
                    'address' => $validated['address'],
                    'contact_number' => $validated['contact_number'],
                ]);
            } else {
                $organization = Organization::create([
                    'user_id' => $user->id,
                    'division_id' => $validated['division_id'],
                    'organization_kind' => 'DS_OFFICE',
                    'name' => $validated['organization_name'],
                    'institution_type_id' => null,
                    'address' => $validated['address'],
                    'contact_number' => $validated['contact_number'],
                ]);
            }

            AuthorizedContact::create([
                'organization_id' => $organization->id,
                'full_name' => $validated['contact_person_name'],
                'designation' => $validated['contact_person_designation'],
                'nic_number' => $validated['contact_person_nic'],
                'phone' => $validated['contact_person_phone'],
                'email' => $validated['contact_person_email'],
                'is_primary' => true,
            ]);

            return $user;
        });

        $this->notifyApprovers($user);

        return response()->json([
            'message' => 'Registration successful. Your account is awaiting approval.',
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