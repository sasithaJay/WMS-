<?php

namespace Tests\Feature;

use App\Models\Role;
use App\Models\StaffProfile;
use App\Models\User;
use App\Notifications\TemporaryPasswordIssued;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class ForgotPasswordTest extends TestCase
{
    use RefreshDatabase;

    public function test_it_issues_a_temporary_password_by_sms_for_a_username_with_a_phone_number(): void
    {
        Notification::fake();
        $user = $this->createStaffUser('recovery-user', 'current-password');

        $response = $this->postJson('/api/forgot-password', [
            'username' => $user->username,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('message', 'If the username is registered and has a phone number, a temporary password has been sent by SMS.');

        $this->assertFalse(Hash::check('current-password', $user->fresh()->password));
        Notification::assertSentTo($user, TemporaryPasswordIssued::class);
    }

    public function test_it_does_not_reset_or_notify_when_the_username_does_not_exist(): void
    {
        Notification::fake();

        $this->postJson('/api/forgot-password', [
            'username' => 'not-a-user',
        ])->assertOk();

        Notification::assertNothingSent();
    }

    private function createStaffUser(string $username, string $password): User
    {
        $role = Role::query()->create([
            'name' => 'Test role',
            'code' => 'TEST_ROLE',
        ]);

        $user = User::query()->create([
            'username' => $username,
            'account_type' => 'STAFF',
            'account_status' => 'ACTIVE',
            'password' => Hash::make($password),
        ]);

        StaffProfile::query()->create([
            'user_id' => $user->id,
            'role_id' => $role->id,
            'full_name' => 'Recovery Test User',
            'nic_number' => 'NIC-' . $username,
            'phone' => '0771234567',
            'employee_number' => 'EMP-' . $username,
        ]);

        return $user;
    }
}
