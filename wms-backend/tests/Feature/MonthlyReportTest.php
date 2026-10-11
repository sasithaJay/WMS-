<?php

namespace Tests\Feature;

use App\Http\Controllers\Api\ReportController;
use App\Models\Division;
use App\Models\Item;
use App\Models\ItemCategory;
use App\Models\Role;
use App\Models\StaffProfile;
use App\Models\StockMovement;
use App\Models\StockReceipt;
use App\Models\StockReceiptItem;
use App\Models\Unit;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

class MonthlyReportTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        $this->createReportSchema();
    }

    public function test_month_year_and_division_filters_use_actual_transaction_dates_and_preserve_lines(): void
    {
        [$admin, $divisionA, $divisionB, $itemA, $itemB] = $this->setUpReportData();
        $this->receipt($admin, $divisionA, $itemA, 'GRN-JUL-1', '2026-07-08', '2026-08-01', 2);
        $this->receipt($admin, $divisionA, $itemA, 'GRN-JUL-2', '2026-07-31', '2026-07-31', 3);
        $this->receipt($admin, $divisionA, $itemA, 'GRN-AUG', '2026-08-01', '2026-08-01', 9);
        $this->receipt($admin, $divisionB, $itemB, 'GRN-OTHER-DIV', '2026-07-14', '2026-07-14', 4);
        $this->issue($admin, $divisionA, $itemA, '2026-07-31 23:59:59', 5, 'REQ-JUL');
        $this->issue($admin, $divisionA, $itemA, '2026-08-01 00:00:00', 7, 'REQ-AUG');
        $this->issue($admin, $divisionB, $itemB, '2026-07-20 12:00:00', 8, 'REQ-OTHER-DIV');
        $data = $this->monthly($admin, ['month' => 7, 'year' => 2026, 'division_id' => $divisionA->id]);

        $this->assertCount(1, $data);
        $this->assertSame($divisionA->id, $data[0]['division_id']);
        $this->assertCount(2, $data[0]['received_items']);
        $this->assertSame(['GRN-JUL-1', 'GRN-JUL-2'], array_column($data[0]['received_items'], 'reference_number'));
        $this->assertSame(['2026-07-08', '2026-07-31'], array_column($data[0]['received_items'], 'date'));
        $this->assertEquals([23.0, 34.5], array_column($data[0]['received_items'], 'total_amount_with_vat'));
        $this->assertEquals(50.0, $data[0]['receipt_subtotal']);
        $this->assertEquals(7.5, $data[0]['receipt_vat']);
        $this->assertEquals(57.5, $data[0]['receipt_total_with_vat']);
        $this->assertEquals(5.0, $data[0]['received_totals'][0]['quantity']);
        $this->assertSame('box', $data[0]['received_totals'][0]['unit']);
        $this->assertCount(1, $data[0]['issued_items']);
        $this->assertSame('REQ-JUL', $data[0]['issued_items'][0]['reference_number']);
        $this->assertEquals(5.0, $data[0]['issued_items'][0]['quantity']);
    }

    public function test_all_divisions_and_leap_day_filtering_and_empty_result(): void
    {
        [$admin, $divisionA, $divisionB, $itemA, $itemB] = $this->setUpReportData();
        $this->receipt($admin, $divisionA, $itemA, 'GRN-LEAP', '2024-02-29', '2024-03-01', 1);
        $this->issue($admin, $divisionB, $itemB, '2024-02-29 23:59:59', 2, 'REQ-LEAP');

        $allDivisions = $this->monthly($admin, ['month' => 2, 'year' => 2024]);
        $this->assertCount(2, $allDivisions);
        $this->assertSame('2024-02-29', $allDivisions[0]['received_items'][0]['date']);
        $this->assertSame('2024-02-29', $allDivisions[1]['issued_items'][0]['date']);

        $empty = $this->monthly($admin, ['month' => 3, 'year' => 2024]);
        $this->assertSame([], $empty);
    }

    public function test_annual_report_filters_january_and_december_boundaries_by_division(): void
    {
        [$admin, $divisionA, $divisionB, $itemA, $itemB] = $this->setUpReportData();
        $this->receipt($admin, $divisionA, $itemA, 'GRN-YEAR-START', '2026-01-01', '2026-01-01', 1);
        $this->receipt($admin, $divisionA, $itemA, 'GRN-YEAR-END', '2026-12-31', '2027-01-01', 2);
        $this->receipt($admin, $divisionA, $itemA, 'GRN-NEXT-YEAR', '2027-01-01', '2027-01-01', 9);
        $this->receipt($admin, $divisionA, $itemA, 'GRN-PREVIOUS-YEAR', '2025-12-31', '2025-12-31', 9);
        $this->issue($admin, $divisionA, $itemA, '2026-01-01 00:00:00', 3, 'REQ-YEAR-START');
        $this->issue($admin, $divisionA, $itemA, '2026-12-31 23:59:59', 4, 'REQ-YEAR-END');
        $this->issue($admin, $divisionA, $itemA, '2027-01-01 00:00:00', 8, 'REQ-NEXT-YEAR');
        $this->issue($admin, $divisionB, $itemB, '2026-12-31 12:00:00', 5, 'REQ-OTHER-DIV');

        $selectedDivision = $this->annual($admin, ['year' => 2026, 'division_id' => $divisionA->id]);
        $this->assertCount(1, $selectedDivision);
        $this->assertCount(2, $selectedDivision[0]['received_items']);
        $this->assertSame(['2026-01-01', '2026-12-31'], array_column($selectedDivision[0]['received_items'], 'date'));
        $this->assertCount(2, $selectedDivision[0]['issued_items']);
        $this->assertSame(['2026-01-01', '2026-12-31'], array_column($selectedDivision[0]['issued_items'], 'date'));

        $allDivisions = $this->annual($admin, ['year' => 2026]);
        $this->assertCount(2, $allDivisions);
        $this->assertSame([], $this->annual($admin, ['year' => 2024]));
    }

    public function test_month_must_be_valid(): void
    {
        [$admin] = $this->setUpReportData();
        $request = Request::create('/api/reports/monthly', 'GET', ['month' => 13, 'year' => 2026]);
        $request->setUserResolver(fn () => $admin);

        try {
            app(ReportController::class)->monthly($request);
            $this->fail('An invalid month should fail validation.');
        } catch (ValidationException $exception) {
            $this->assertArrayHasKey('month', $exception->errors());
        }
    }

    private function monthly(User $admin, array $query): array
    {
        $request = Request::create('/api/reports/monthly', 'GET', $query);
        $request->setUserResolver(fn () => $admin);

        return app(ReportController::class)->monthly($request)->getData(true)['data'];
    }

    private function annual(User $admin, array $query): array
    {
        $request = Request::create('/api/reports/annual', 'GET', $query);
        $request->setUserResolver(fn () => $admin);

        return app(ReportController::class)->annual($request)->getData(true)['data'];
    }

    private function setUpReportData(): array
    {
        $adminRole = Role::query()->create(['name_en' => 'Admin', 'name_si' => 'Admin', 'code' => 'ADMIN']);
        $admin = User::query()->create([
            'username' => 'monthly-admin',
            'account_type' => 'STAFF',
            'account_status' => 'ACTIVE',
            'password' => 'password',
        ]);
        StaffProfile::query()->create([
            'user_id' => $admin->id,
            'role_id' => $adminRole->id,
            'full_name' => 'Monthly Admin',
            'nic_number' => 'MONTHLY-ADMIN-NIC',
            'phone' => '0770000000',
            'employee_number' => 'MONTHLY-ADMIN',
        ]);
        $divisionA = Division::query()->create(['name_en' => 'Division A', 'name_si' => 'A', 'code' => 'DIV-A']);
        $divisionB = Division::query()->create(['name_en' => 'Division B', 'name_si' => 'B', 'code' => 'DIV-B']);
        $unit = Unit::query()->create(['name_en' => 'Box', 'symbol' => 'box']);
        $category = ItemCategory::query()->create(['name_en' => 'Stationery', 'code' => 'STAT']);
        $itemA = Item::query()->create([
            'division_id' => $divisionA->id, 'category_id' => $category->id, 'unit_id' => $unit->id,
            'item_code' => 'A-001', 'name_en' => 'Paper', 'created_by' => $admin->id,
        ]);
        $itemB = Item::query()->create([
            'division_id' => $divisionB->id, 'category_id' => $category->id, 'unit_id' => $unit->id,
            'item_code' => 'B-001', 'name_en' => 'Pens', 'created_by' => $admin->id,
        ]);

        return [$admin, $divisionA, $divisionB, $itemA, $itemB];
    }

    private function createReportSchema(): void
    {
        foreach (['stock_requests', 'stock_movements', 'stock_receipt_items', 'stock_receipts', 'items', 'item_categories', 'units', 'staff_profiles', 'roles', 'divisions', 'users'] as $table) {
            Schema::dropIfExists($table);
        }

        Schema::create('users', function (Blueprint $table) {
            $table->id(); $table->string('username')->unique(); $table->string('email')->nullable();
            $table->string('account_type'); $table->string('account_status'); $table->string('password');
            $table->unsignedBigInteger('approved_by')->nullable(); $table->timestamp('approved_at')->nullable();
            $table->string('rejection_reason')->nullable(); $table->rememberToken(); $table->timestamps();
        });
        Schema::create('divisions', function (Blueprint $table) {
            $table->id(); $table->string('name_en'); $table->string('name_si'); $table->string('code')->unique();
            $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('roles', function (Blueprint $table) {
            $table->id(); $table->string('name_en'); $table->string('name_si')->nullable(); $table->string('code')->unique(); $table->unsignedInteger('level')->nullable();
            $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('staff_profiles', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('user_id')->unique(); $table->unsignedBigInteger('division_id')->nullable();
            $table->unsignedBigInteger('section_id')->nullable(); $table->unsignedBigInteger('role_id');
            $table->string('full_name'); $table->string('nic_number'); $table->string('phone'); $table->string('employee_number'); $table->timestamps();
        });
        Schema::create('units', function (Blueprint $table) {
            $table->id(); $table->string('name_en'); $table->string('name_si')->nullable(); $table->string('symbol')->nullable();
            $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('item_categories', function (Blueprint $table) {
            $table->id(); $table->string('name_en'); $table->string('name_si')->nullable(); $table->string('code')->unique();
            $table->boolean('is_active')->default(true); $table->timestamps();
        });
        Schema::create('items', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('division_id'); $table->unsignedBigInteger('category_id'); $table->unsignedBigInteger('unit_id');
            $table->string('item_code')->unique(); $table->string('name_en'); $table->string('name_si')->nullable();
            $table->text('description')->nullable(); $table->string('barcode')->nullable(); $table->unsignedInteger('reorder_level')->default(0);
            $table->boolean('is_active')->default(true); $table->unsignedBigInteger('created_by')->nullable(); $table->timestamps();
        });
        Schema::create('stock_receipts', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('division_id'); $table->string('grn_number')->unique(); $table->string('supplier_name');
            $table->string('invoice_number')->nullable(); $table->date('received_date'); $table->text('notes')->nullable();
            $table->decimal('subtotal', 15, 2)->default(0); $table->decimal('vat_percentage', 5, 2)->default(0);
            $table->decimal('vat_amount', 15, 2)->default(0); $table->decimal('total_with_vat', 15, 2)->default(0); $table->string('status');
            $table->unsignedBigInteger('created_by'); $table->unsignedBigInteger('confirmed_by')->nullable(); $table->timestamp('confirmed_at')->nullable();
            $table->unsignedBigInteger('cancelled_by')->nullable(); $table->timestamp('cancelled_at')->nullable(); $table->text('cancellation_reason')->nullable(); $table->timestamps();
        });
        Schema::create('stock_receipt_items', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('stock_receipt_id'); $table->unsignedBigInteger('item_id');
            $table->decimal('quantity_received', 15, 3); $table->decimal('unit_cost', 15, 2)->nullable(); $table->text('remarks')->nullable(); $table->timestamps();
        });
        Schema::create('stock_movements', function (Blueprint $table) {
            $table->id(); $table->unsignedBigInteger('division_id'); $table->unsignedBigInteger('item_id'); $table->string('movement_type');
            $table->decimal('quantity', 15, 3); $table->decimal('balance_before', 15, 3); $table->decimal('balance_after', 15, 3);
            $table->string('reference_type')->nullable(); $table->unsignedBigInteger('reference_id')->nullable(); $table->string('reference_number')->nullable();
            $table->unsignedBigInteger('performed_by'); $table->text('remarks')->nullable(); $table->timestamps();
        });
        Schema::create('stock_requests', function (Blueprint $table) {
            $table->id(); $table->string('request_number');
        });
    }

    private function receipt(User $admin, Division $division, Item $item, string $grn, string $received, string $created, float $quantity): void
    {
        $receipt = StockReceipt::query()->create([
            'division_id' => $division->id,
            'grn_number' => $grn,
            'supplier_name' => 'Test Supplier',
            'received_date' => $received,
            'subtotal' => round($quantity * 10, 2),
            'vat_percentage' => 15,
            'vat_amount' => round($quantity * 10 * 0.15, 2),
            'total_with_vat' => round($quantity * 10 * 1.15, 2),
            'status' => 'CONFIRMED',
            'created_by' => $admin->id,
            'confirmed_by' => $admin->id,
            'confirmed_at' => $created,
            'created_at' => $created,
            'updated_at' => $created,
        ]);
        StockReceiptItem::query()->create([
            'stock_receipt_id' => $receipt->id,
            'item_id' => $item->id,
            'quantity_received' => $quantity,
            'unit_cost' => 10,
        ]);
    }

    private function issue(User $admin, Division $division, Item $item, string $date, float $quantity, string $reference): void
    {
        $movement = StockMovement::query()->create([
            'division_id' => $division->id,
            'item_id' => $item->id,
            'movement_type' => 'ISSUE',
            'quantity' => $quantity,
            'balance_before' => 20,
            'balance_after' => 20 - $quantity,
            'reference_type' => 'STOCK_REQUEST',
            'reference_id' => 999,
            'reference_number' => $reference,
            'performed_by' => $admin->id,
            'created_at' => $date,
            'updated_at' => $date,
        ]);
        \Illuminate\Support\Facades\DB::table('stock_movements')->where('id', $movement->id)->update([
            'created_at' => $date,
            'updated_at' => $date,
        ]);
    }
}
