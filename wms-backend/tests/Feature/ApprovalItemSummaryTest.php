<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\StockRequestController;
use App\Models\Role;
use App\Models\StaffProfile;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class ApprovalItemSummaryTest extends TestCase
{
    private array $divisions = [];
    private array $stores = [];
    private array $roles = [];
    private User $commissioner;
    private User $socialApprover;

    protected function setUp(): void
    {
        parent::setUp();
        Auth::forgetGuards();
        $this->createSchema();
        $this->createBaseData();
    }

    public function test_item_summary_groups_pending_quantities_by_officer_and_excludes_finalized_items(): void
    {
        $paper = $this->item('CR-001', 'CR Book');
        $pen = $this->item('PEN-001', 'Pens');
        $officerA = $this->requester('officer-a', 'Rasika', 'DEVELOPMENT_OFFICER', $this->divisions['social']);
        $officerB = $this->requester('officer-b', 'Jagath', 'DEVELOPMENT_OFFICER', $this->divisions['social']);
        DB::table('inventory_balances')->insert([
            'item_id' => $paper['id'],
            'division_id' => $this->divisions['social'],
            'quantity_on_hand' => 20,
            'reserved_quantity' => 3,
        ]);

        $this->addApprovalRule($this->divisions['social'], $this->roles['development'], $this->roles['commissioner']);
        $this->request($officerA, $this->stores['social'], [[$paper, 5], [$pen, 6]]);
        $this->request($officerB, $this->stores['social'], [[$paper, 2], [$pen, 3]]);
        $finalized = $this->request($officerA, $this->stores['social'], [[$paper, 100]]);
        DB::table('stock_requests')->where('id', $finalized)->update(['current_stage' => null, 'status' => 'APPROVED']);
        DB::table('stock_request_items')->where('stock_request_id', $finalized)->update(['approval_status' => 'approved']);
        $stillAwaitingRecommendation = $this->request($officerA, $this->stores['social'], [[$paper, 200]]);
        DB::table('stock_requests')->where('id', $stillAwaitingRecommendation)->update(['current_stage' => 'RECOMMENDATION', 'status' => 'PENDING_RECOMMENDATION']);
        $alreadyHandledItem = $this->request($officerA, $this->stores['social'], [[$paper, 300]]);
        DB::table('stock_request_items')->where('stock_request_id', $alreadyHandledItem)->update(['approval_status' => 'rejected']);

        $data = $this->summary($this->commissioner, $this->stores['social']->id);
        $paperId = $paper['id'];
        $penId = $pen['id'];

        $this->assertSame(7.0, (float) $data['totals'][$paperId]);
        $this->assertSame(9.0, (float) $data['totals'][$penId]);
        $this->assertCount(2, $data['officers']);
        $rasika = collect($data['officers'])->firstWhere('name', 'Rasika');
        $this->assertSame(5.0, (float) $rasika['quantities'][$paperId]);
        $this->assertSame(6.0, (float) $rasika['quantities'][$penId]);
        $paperSummary = collect($data['items'])->firstWhere('id', $paperId);
        $this->assertSame(17.0, (float) $paperSummary['available_quantity']);
    }

    public function test_duplicate_item_rows_and_multiple_requests_are_summed_once(): void
    {
        $paper = $this->item('CR-002', 'CR Book');
        $officer = $this->requester('officer-c', 'Amara', 'DEVELOPMENT_OFFICER', $this->divisions['social']);
        $this->addApprovalRule($this->divisions['social'], $this->roles['development'], $this->roles['commissioner']);
        $this->request($officer, $this->stores['social'], [[$paper, 2], [$paper, 1]]);
        $this->request($officer, $this->stores['social'], [[$paper, 3]]);

        $data = $this->summary($this->commissioner, $this->stores['social']->id);
        $this->assertSame(6.0, (float) $data['totals'][$paper['id']]);
        $this->assertSame(6.0, (float) $data['officers'][0]['quantities'][$paper['id']]);
    }

    public function test_commissioner_can_switch_stores_and_other_officers_cannot_read_another_division(): void
    {
        $paper = $this->item('CR-003', 'CR Book');
        $socialOfficer = $this->requester('officer-social', 'Social Officer', 'DEVELOPMENT_OFFICER', $this->divisions['social']);
        $childOfficer = $this->requester('officer-child', 'Child Officer', 'CHILD_DEVELOPMENT_OFFICER', $this->divisions['child']);
        $this->addApprovalRule($this->divisions['social'], $this->roles['development'], $this->roles['commissioner']);
        $this->addApprovalRule($this->divisions['child'], $this->roles['child_development'], $this->roles['commissioner']);
        $this->addApprovalRule($this->divisions['social'], $this->roles['development'], $this->roles['social_approver']);
        $this->request($socialOfficer, $this->stores['social'], [[$paper, 4]]);
        $this->request($childOfficer, $this->stores['child'], [[$paper, 8]]);

        $social = $this->summary($this->commissioner, $this->stores['social']->id);
        $child = $this->summary($this->commissioner, $this->stores['child']->id);
        $this->assertSame(4.0, (float) $social['totals'][$paper['id']]);
        $this->assertSame(8.0, (float) $child['totals'][$paper['id']]);
        $this->assertCount(2, $social['stores']);

        $officerView = $this->summary($this->socialApprover, $this->stores['social']->id);
        $this->assertSame(4.0, (float) $officerView['totals'][$paper['id']]);
        $this->assertCount(1, $officerView['stores']);

        $this->expectException(HttpException::class);
        $this->summary($this->socialApprover, $this->stores['child']->id);
    }

    public function test_empty_store_returns_an_empty_summary_for_that_store(): void
    {
        $data = $this->summary($this->commissioner, $this->stores['social']->id);

        $this->assertSame($this->stores['social']->id, $data['store']['id']);
        $this->assertSame([], $data['items']);
        $this->assertSame([], $data['officers']);
        $this->assertSame([], $data['totals']);
    }

    public function test_each_approval_officer_sees_their_own_pending_request_in_the_requester_summary(): void
    {
        $paper = $this->item('CR-OWN', 'CR Book');
        $accountant = $this->requester('accountant-user', 'Accountant', 'ACCOUNTANT', $this->divisions['social']);

        $this->addApprovalRule($this->divisions['social'], $this->roles['commissioner'], $this->roles['social_approver']);
        $this->addApprovalRule($this->divisions['social'], $this->roles['commissioner'], $this->roles['accountant']);
        $this->addApprovalRule($this->divisions['social'], $this->roles['social_approver'], $this->roles['commissioner']);
        $this->addApprovalRule($this->divisions['social'], $this->roles['accountant'], $this->roles['commissioner']);

        $this->request($this->commissioner, $this->stores['social'], [[$paper, 4]]);
        $this->request($this->socialApprover, $this->stores['social'], [[$paper, 2]]);
        $this->request($accountant, $this->stores['social'], [[$paper, 3]]);

        $commissionerView = $this->summary($this->commissioner, $this->stores['social']->id);
        $assistantDirectorView = $this->summary($this->socialApprover, $this->stores['social']->id);
        $accountantView = $this->summary($accountant, $this->stores['social']->id);

        $this->assertSame(9.0, (float) $commissionerView['totals'][$paper['id']]);
        $this->assertSame(6.0, (float) $assistantDirectorView['totals'][$paper['id']]);
        $this->assertSame(7.0, (float) $accountantView['totals'][$paper['id']]);
        $commissionerRow = collect($commissionerView['officers'])->firstWhere('id', $this->commissioner->id);
        $this->assertSame(4.0, (float) $commissionerRow['quantities'][$paper['id']]);
        $this->assertContains($this->commissioner->id, array_column($assistantDirectorView['officers'], 'id'));
        $this->assertContains($this->commissioner->id, array_column($accountantView['officers'], 'id'));
    }

    private function summary(User $user, int $storeId): array
    {
        Auth::setUser($user);
        $request = Request::create('/api/stock-requests/pending-approval/item-summary', 'GET', ['store_id' => $storeId]);
        return app(StockRequestController::class)->pendingApprovalItemSummary($request)->getData(true)['data'];
    }

    private function createBaseData(): void
    {
        $this->roles['commissioner'] = Role::query()->create(['name_en' => 'Commissioner', 'code' => 'COMMISSIONER']);
        $this->roles['social_approver'] = Role::query()->create(['name_en' => 'Assistant Director', 'code' => 'ASSISTANT_DIRECTOR']);
        $this->roles['accountant'] = Role::query()->create(['name_en' => 'Accountant', 'code' => 'ACCOUNTANT']);
        $this->roles['development'] = Role::query()->create(['name_en' => 'Development Officer', 'code' => 'DEVELOPMENT_OFFICER']);
        $this->roles['child_development'] = Role::query()->create(['name_en' => 'Child Development Officer', 'code' => 'CHILD_DEVELOPMENT_OFFICER']);

        foreach ([['social', 'Social Services Division', 'SOCIAL_SERVICES'], ['child', 'Child Services Division', 'CHILD_SERVICES']] as [$key, $name, $code]) {
            $divisionId = DB::table('divisions')->insertGetId(['name_en' => $name, 'name_si' => $name, 'code' => $code, 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
            $storeId = DB::table('stores')->insertGetId(['division_id' => $divisionId, 'name_en' => str_replace('Division', 'Store', $name), 'name_si' => $name, 'code' => strtoupper($key) . '_STORE', 'is_active' => true, 'created_at' => now(), 'updated_at' => now()]);
            $this->divisions[$key] = $divisionId;
            $this->stores[$key] = Store::query()->findOrFail($storeId);
        }

        $this->commissioner = $this->requester('commissioner', 'Commissioner', 'COMMISSIONER', $this->divisions['social']);
        $this->socialApprover = $this->requester('assistant-director', 'Assistant Director', 'ASSISTANT_DIRECTOR', $this->divisions['social']);
    }

    private function requester(string $username, string $name, string $roleKey, int $divisionId): User
    {
        $role = match ($roleKey) {
            'COMMISSIONER' => $this->roles['commissioner'],
            'ASSISTANT_DIRECTOR' => $this->roles['social_approver'],
            'ACCOUNTANT' => $this->roles['accountant'],
            'CHILD_DEVELOPMENT_OFFICER' => $this->roles['child_development'],
            default => $this->roles['development'],
        };
        $user = User::query()->create([
            'username' => $username,
            'account_type' => 'STAFF',
            'account_status' => 'ACTIVE',
            'password' => 'password',
        ]);
        StaffProfile::query()->create([
            'user_id' => $user->id,
            'division_id' => $divisionId,
            'role_id' => $role->id,
            'full_name' => $name,
            'nic_number' => 'NIC-' . $username,
            'phone' => '0770000000',
            'employee_number' => 'EMP-' . $username,
        ]);
        return $user->fresh();
    }

    private function addApprovalRule(int $divisionId, Role $requesterRole, Role $approverRole): void
    {
        DB::table('approval_rules')->insert([
            'division_id' => $divisionId,
            'requester_role_id' => $requesterRole->id,
            'request_context' => 'PERSONAL',
            'approver_role_id' => $approverRole->id,
            'priority' => 10,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    private function item(string $code, string $name): array
    {
        $id = DB::table('items')->insertGetId(['item_code' => $code, 'name_en' => $name, 'created_at' => now(), 'updated_at' => now()]);
        return ['id' => $id];
    }

    private function request(User $requester, Store $store, array $items): int
    {
        $profile = $requester->staffProfile;
        $id = DB::table('stock_requests')->insertGetId([
            'request_number' => 'REQ-' . uniqid(),
            'requester_id' => $requester->id,
            'division_id' => $store->division_id,
            'store_id' => $store->id,
            'request_context' => 'PERSONAL',
            'status' => 'PENDING_APPROVAL',
            'current_stage' => 'APPROVAL',
            'submitted_at' => now(),
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        foreach ($items as [$item, $quantity]) {
            DB::table('stock_request_items')->insert([
                'stock_request_id' => $id,
                'item_id' => $item['id'],
                'quantity_requested' => $quantity,
                'approval_status' => 'pending',
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
        return $id;
    }

    private function createSchema(): void
    {
        foreach (['approval_rules', 'organizations', 'inventory_balances', 'stock_request_items', 'stock_requests', 'items', 'stores', 'staff_profiles', 'roles', 'divisions', 'users'] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::create('users', function (Blueprint $table) {
            $table->id(); $table->string('username')->unique(); $table->string('account_type'); $table->string('account_status'); $table->string('password'); $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->id(); $table->string('name_en'); $table->string('name_si')->nullable(); $table->string('code')->unique(); $table->unsignedInteger('level')->nullable(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('divisions', function (Blueprint $table) {
            $table->id(); $table->string('name_en'); $table->string('name_si'); $table->string('code')->unique(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('stores', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('division_id'); $table->string('name_en'); $table->string('name_si'); $table->string('code')->unique(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('user_id')->unique(); $table->unsignedBigInteger('division_id')->nullable(); $table->unsignedBigInteger('section_id')->nullable(); $table->unsignedBigInteger('role_id'); $table->string('full_name'); $table->string('nic_number'); $table->string('phone'); $table->string('employee_number'); $table->timestamps();
        });
        Schema::create('organizations', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('user_id')->unique(); $table->string('name');
        });
        Schema::create('items', function (Blueprint $table) {
            $table->id(); $table->string('item_code')->unique(); $table->string('name_en'); $table->timestamps();
        });
        Schema::create('inventory_balances', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('item_id'); $table->unsignedBigInteger('division_id'); $table->unsignedInteger('quantity_on_hand')->default(0); $table->unsignedInteger('reserved_quantity')->default(0); $table->timestamps();
        });
        Schema::create('stock_requests', function (Blueprint $table) {
            $table->id(); $table->string('request_number')->unique(); $table->unsignedBigInteger('requester_id'); $table->unsignedBigInteger('division_id'); $table->unsignedBigInteger('store_id'); $table->unsignedBigInteger('section_id')->nullable(); $table->unsignedBigInteger('organization_id')->nullable(); $table->string('request_context'); $table->string('status'); $table->string('current_stage')->nullable(); $table->unsignedBigInteger('recommender_id')->nullable(); $table->unsignedBigInteger('approver_id')->nullable(); $table->text('notes')->nullable(); $table->timestamp('submitted_at')->nullable(); $table->timestamps();
        });
        Schema::create('stock_request_items', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('stock_request_id'); $table->unsignedBigInteger('item_id'); $table->decimal('quantity_requested', 15, 3); $table->decimal('quantity_recommended', 15, 3)->nullable(); $table->decimal('quantity_approved', 15, 3)->nullable(); $table->decimal('quantity_issued', 15, 3)->nullable(); $table->string('approval_status')->default('pending'); $table->timestamps();
        });
        Schema::create('approval_rules', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('division_id')->nullable(); $table->unsignedBigInteger('requester_role_id')->nullable(); $table->string('organization_kind')->nullable(); $table->string('request_context')->nullable(); $table->unsignedBigInteger('approver_role_id')->nullable(); $table->unsignedInteger('priority')->default(0); $table->timestamps();
        });
    }
}
