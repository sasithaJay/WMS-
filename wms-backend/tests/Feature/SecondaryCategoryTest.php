<?php

namespace Tests\Feature;

use App\Models\ItemCategory;
use App\Models\Permission;
use App\Models\Role;
use App\Models\StaffProfile;
use App\Models\User;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Tests\TestCase;

class SecondaryCategoryTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        Schema::create('users', function (Blueprint $table) {
            $table->id(); $table->string('username')->unique(); $table->string('password');
            $table->string('account_type'); $table->string('account_status'); $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('code')->unique(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('permissions', function (Blueprint $table) {
            $table->id(); $table->string('name'); $table->string('code')->unique(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('role_permission', function (Blueprint $table) {
            $table->id(); $table->foreignId('role_id'); $table->foreignId('permission_id'); $table->timestamps();
        });
        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id(); $table->foreignId('user_id'); $table->foreignId('role_id');
            $table->string('full_name'); $table->string('nic_number'); $table->string('phone'); $table->string('employee_number'); $table->timestamps();
        });
        Schema::create('item_categories', function (Blueprint $table) {
            $table->id(); $table->foreignId('parent_category_id')->nullable(); $table->string('name_en');
            $table->string('normalized_name')->nullable(); $table->string('name_si')->nullable();
            $table->string('description', 500)->nullable(); $table->string('code')->unique();
            $table->boolean('is_active')->default(true); $table->timestamps();
            $table->unique(['parent_category_id', 'normalized_name']);
        });
        Schema::create('units', function (Blueprint $table) {
            $table->id(); $table->string('name_en'); $table->string('name_si')->nullable();
            $table->string('symbol')->nullable(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
    }

    public function test_migration_adds_secondary_category_fields_and_backfills_existing_roots(): void
    {
        Schema::drop('item_categories');
        Schema::create('item_categories', function (Blueprint $table) {
            $table->id(); $table->string('name_en'); $table->string('name_si')->nullable();
            $table->string('code')->unique(); $table->boolean('is_active')->default(true); $table->timestamps();
        });
        $root = ItemCategory::query()->create(['name_en' => '  Office Equipment ', 'code' => 'OFFICE_EQUIPMENT']);

        $migration = require database_path('migrations/2026_10_27_000001_add_secondary_category_support.php');
        $migration->up();

        $this->assertTrue(Schema::hasColumns('item_categories', ['parent_category_id', 'description', 'normalized_name']));
        $this->assertDatabaseHas('item_categories', ['id' => $root->id, 'normalized_name' => 'office equipment']);
    }

    public function test_authorized_user_creates_a_secondary_category_and_normalizes_its_name(): void
    {
        $user = $this->userWithPermission();
        $main = $this->mainCategory('Stationery', 'STATIONERY');

        $this->actingAs($user)->postJson('/api/item-categories', [
            'main_category_id' => $main->id,
            'name' => '  CR   Books  ',
            'description' => 'Books for CR records',
        ])->assertCreated()
            ->assertJsonPath('data.name_en', 'CR Books')
            ->assertJsonPath('data.normalized_name', 'cr books')
            ->assertJsonPath('data.parent_category_id', $main->id);

        $this->assertDatabaseHas('item_categories', [
            'parent_category_id' => $main->id,
            'name_en' => 'CR Books',
            'normalized_name' => 'cr books',
        ]);
    }

    public function test_duplicate_normalized_names_are_rejected_only_within_the_same_main_category(): void
    {
        $user = $this->userWithPermission();
        $stationery = $this->mainCategory('Stationery', 'STATIONERY');
        $filing = $this->mainCategory('Filing', 'FILING');

        $this->actingAs($user)->postJson('/api/item-categories', [
            'main_category_id' => $stationery->id,
            'name' => 'Box Files',
        ])->assertCreated();

        $this->postJson('/api/item-categories', [
            'main_category_id' => $stationery->id,
            'name' => '  box   files ',
        ])->assertUnprocessable()->assertJsonValidationErrors('name');

        $this->postJson('/api/item-categories', [
            'main_category_id' => $filing->id,
            'name' => 'Box Files',
        ])->assertCreated();
    }

    public function test_category_creation_requires_permission_and_an_active_root_category(): void
    {
        $main = $this->mainCategory('Stationery', 'STATIONERY');
        $inactiveMain = $this->mainCategory('Filing', 'FILING', false);

        $this->actingAs($this->userWithoutPermission())->postJson('/api/item-categories', [
            'main_category_id' => $main->id,
            'name' => 'Pens',
        ])->assertForbidden();

        $this->actingAs($this->userWithPermission())->postJson('/api/item-categories', [
            'main_category_id' => $inactiveMain->id,
            'name' => 'Box Files',
        ])->assertUnprocessable()->assertJsonValidationErrors('main_category_id');
    }

    public function test_item_form_lookups_load_secondary_categories_and_units(): void
    {
        $user = $this->userWithPermission();
        $role = $user->staffProfile->role;
        $role->permissions()->attach(Permission::query()->create([
            'name' => 'View inventory',
            'code' => 'inventory.view',
        ]));
        $main = $this->mainCategory('Stationery', 'STATIONERY');
        ItemCategory::query()->create([
            'parent_category_id' => $main->id,
            'name_en' => 'Pens',
            'normalized_name' => 'pens',
            'code' => 'STATIONERY-PENS',
            'is_active' => true,
        ]);
        \Illuminate\Support\Facades\DB::table('units')->insert([
            'name_en' => 'Piece', 'symbol' => 'pcs', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        $this->actingAs($user)->getJson('/api/item-categories')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('data.0.name_en', 'Pens')
            ->assertJsonPath('data.0.parent_category_id', $main->id);
        $this->getJson('/api/units')->assertOk()->assertJsonPath('data.0.name_en', 'Piece');
    }

    private function mainCategory(string $name, string $code, bool $active = true): ItemCategory
    {
        return ItemCategory::query()->create([
            'name_en' => $name,
            'normalized_name' => mb_strtolower($name),
            'code' => $code,
            'is_active' => $active,
        ]);
    }

    private function userWithPermission(): User
    {
        $user = $this->userWithoutPermission();
        $role = Role::query()->forceCreate(['name' => 'Inventory Manager', 'code' => 'INVENTORY_MANAGER']);
        $permission = Permission::query()->create(['name' => 'Create inventory', 'code' => 'inventory.create']);
        $role->permissions()->attach($permission->id);
        StaffProfile::query()->create([
            'user_id' => $user->id,
            'role_id' => $role->id,
            'full_name' => 'Inventory Manager',
            'nic_number' => '123456789V',
            'phone' => '0770000000',
            'employee_number' => 'EMP-001',
        ]);

        return $user;
    }

    private function userWithoutPermission(): User
    {
        return User::query()->create([
            'username' => 'inventory-user-' . uniqid(),
            'account_type' => 'STAFF',
            'account_status' => 'ACTIVE',
            'password' => 'password',
        ]);
    }
}
