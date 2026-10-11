<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\StockReceipt;
use App\Models\StockRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Carbon\CarbonImmutable;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Symfony\Component\HttpFoundation\Response;

class ReportController extends Controller
{
    // ------------------------------------------------------------------
    // Shared scoping helper — same Commissioner-vs-everyone-else pattern
    // used across the rest of the app.
    // ------------------------------------------------------------------

    private function resolveDivisionIds(Request $request): \Illuminate\Support\Collection
    {
        $user = $request->user();
        $isCommissioner = $user->staffProfile?->role?->code === 'COMMISSIONER';
        $isAdmin = $user->staffProfile?->role?->code === 'ADMIN';

        if ($isCommissioner || $isAdmin) {
            return $request->filled('division_id')
                ? collect([$request->integer('division_id')])
                : Division::pluck('id');
        }

        $divisionId = $user->staffProfile?->division_id;
        abort_unless($divisionId, 403, 'Your account is not assigned to a division.');

        return collect([$divisionId]);
    }

    // ------------------------------------------------------------------
    // 1. Current Stock Report
    // ------------------------------------------------------------------

    public function stock(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->buildStockReportData($request)]);
    }

    public function stockPdf(Request $request): Response
    {
        $data = $this->buildStockReportData($request);
        $pdf = Pdf::loadView('reports.stock', ['rows' => $data, 'generatedAt' => now()]);

        return $pdf->download('stock-report-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildStockReportData(Request $request): \Illuminate\Support\Collection
    {
        $request->validate([
            'status' => ['sometimes', 'nullable', Rule::in(['OUT', 'LOW', 'NORMAL'])],
        ]);

        $divisionIds = $this->resolveDivisionIds($request);

        $rows = Item::query()
            ->with(['category', 'unit', 'division', 'balance'])
            ->whereIn('division_id', $divisionIds)
            ->where('is_active', true)
            ->orderBy('division_id')
            ->orderBy('name_en')
            ->get()
            ->map(fn (Item $item) => [
                'division_name' => $item->division->name_en,
                'item_code' => $item->item_code,
                'name_en' => $item->name_en,
                'category' => $item->category?->name_en,
                'unit' => $item->unit?->name_en,
                'quantity_on_hand' => (float) ($item->balance?->quantity_on_hand ?? 0),
                'reorder_level' => $item->reorder_level,
            'status' => $this->stockStatus((float) ($item->balance?->quantity_on_hand ?? 0), $item->reorder_level),
            ]);

        if ($request->filled('status')) {
            return $rows->where('status', $request->input('status'))->values();
        }

        return $rows;
    }

    private function stockStatus(float $quantity, int $reorderLevel): string
    {
        if ($quantity <= 0) return 'OUT';
        if ($quantity <= $reorderLevel) return 'LOW';
        return 'NORMAL';
    }

    // ------------------------------------------------------------------
    // 2. Issue Report
    // ------------------------------------------------------------------

    public function issue(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->buildIssueReportData($request)]);
    }

    public function issuePdf(Request $request): Response
    {
        $data = $this->buildIssueReportData($request);
        $pdf = Pdf::loadView('reports.issue', [
            'rows' => $data,
            'from' => $request->input('date_from'),
            'to' => $request->input('date_to'),
            'generatedAt' => now(),
        ]);

        return $pdf->download('issue-report-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildIssueReportData(Request $request): \Illuminate\Support\Collection
    {
        $request->validate([
            'requester' => ['sometimes', 'nullable', 'string', 'max:255'],
        ]);
        $divisionIds = $this->resolveDivisionIds($request);

        $query = StockMovement::with(['item', 'division', 'performer', 'stockRequest.requester.staffProfile.role', 'stockRequest.requester.organization'])
            ->whereIn('division_id', $divisionIds)
            ->where('movement_type', 'ISSUE')
            ->latest();

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        if ($request->filled('requester')) {
            $search = trim($request->input('requester'));
            $query->where('reference_type', 'STOCK_REQUEST');
            $query->whereHas('stockRequest.requester', function ($requesterQuery) use ($search) {
                $requesterQuery->where('username', 'like', "%{$search}%")
                    ->orWhereHas('staffProfile', fn ($profileQuery) => $profileQuery->where('full_name', 'like', "%{$search}%"))
                    ->orWhereHas('organization', fn ($organizationQuery) => $organizationQuery->where('name', 'like', "%{$search}%"));
            });
        }

        return $query->get()->map(fn (StockMovement $m) => [
            'date' => $m->created_at->toDateString(),
            'division_name' => $m->division?->name_en ?? '-',
            'item_code' => $m->item->item_code,
            'item_name' => $m->item->name_en,
            'quantity' => (float) $m->quantity,
            'reference_number' => $m->reference_number,
            'performed_by' => $m->performer->name ?? $m->performer->username,
            'requester_name' => $m->stockRequest?->requester?->name ?? '-',
            'requester_position' => $m->stockRequest?->requester?->staffProfile?->role?->name_en
                ?? $m->stockRequest?->requester?->organization?->organization_kind
                ?? $m->stockRequest?->requester?->account_type
                ?? '-',
        ]);
    }

    // ------------------------------------------------------------------
    // 3. Receipt Report
    // ------------------------------------------------------------------

    public function receipt(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->buildReceiptReportData($request)]);
    }

    public function receiptPdf(Request $request): Response
    {
        $data = $this->buildReceiptReportData($request);
        $pdf = Pdf::loadView('reports.receipt', [
            'rows' => $data,
            'from' => $request->input('date_from'),
            'to' => $request->input('date_to'),
            'generatedAt' => now(),
        ]);

        return $pdf->download('receipt-report-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildReceiptReportData(Request $request): \Illuminate\Support\Collection
    {
        $divisionIds = $this->resolveDivisionIds($request);

        $query = StockReceipt::with(['division', 'items.item'])
            ->whereIn('division_id', $divisionIds)
            ->where('status', 'CONFIRMED')
            ->latest('confirmed_at');

        if ($request->filled('date_from')) {
            $query->whereDate('confirmed_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('confirmed_at', '<=', $request->input('date_to'));
        }

        return $query->get()->map(fn (StockReceipt $r) => [
            'grn_number' => $r->grn_number,
            'division_name' => $r->division?->name_en ?? '-',
            'supplier_name' => $r->supplier_name,
            'received_date' => $r->received_date,
            'confirmed_at' => $r->confirmed_at?->toDateString(),
            'item_count' => $r->items->count(),
            'total_quantity' => (float) $r->items->sum('quantity_received'),
            'items' => $r->items->map(fn ($it) => [
                'item_code' => $it->item->item_code,
                'name_en' => $it->item->name_en,
                'quantity_received' => (float) $it->quantity_received,
            ]),
        ]);
    }

    // ------------------------------------------------------------------
    // 4. Monthly Report
    // ------------------------------------------------------------------

    public function monthly(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->buildMonthlyReportData($request)]);
    }

    public function monthlyPdf(Request $request): Response
    {
        $data = $this->buildMonthlyReportData($request);
        $filters = $request->validate([
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:1900,2200'],
            'division_id' => ['sometimes', 'nullable', 'integer', 'exists:divisions,id'],
        ]);
        $visibleDivisionIds = $this->resolveDivisionIds($request);
        $selectedDivisionId = $request->filled('division_id')
            && $visibleDivisionIds->contains((int) $filters['division_id'])
                ? (int) $filters['division_id']
                : ($visibleDivisionIds->count() === 1 ? (int) $visibleDivisionIds->first() : null);
        $pdf = Pdf::loadView('reports.monthly', [
            'divisions' => $data,
            'month' => (int) $filters['month'],
            'year' => (int) $filters['year'],
            'monthName' => CarbonImmutable::create((int) $filters['year'], (int) $filters['month'], 1)->format('F'),
            'divisionName' => $selectedDivisionId
                ? Division::find($selectedDivisionId)?->name_en
                : 'All divisions',
            'generatedAt' => now(),
        ]);

        return $pdf->download('monthly-report-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildMonthlyReportData(Request $request): array
    {
        $filters = $request->validate([
            'month' => ['required', 'integer', 'between:1,12'],
            'year' => ['required', 'integer', 'between:1900,2200'],
            'division_id' => ['sometimes', 'nullable', 'integer', 'exists:divisions,id'],
        ]);
        $month = (int) $filters['month'];
        $year = (int) $filters['year'];
        $from = CarbonImmutable::create($year, $month, 1)->startOfDay();
        $until = $from->addMonth();
        return $this->buildInventoryTransactionReportData($request, $from, $until);
    }

    private function buildInventoryTransactionReportData(
        Request $request,
        CarbonImmutable $from,
        CarbonImmutable $until,
    ): array {
        $divisionIds = $this->resolveDivisionIds($request);
        $groups = [];

        $receipts = StockReceipt::query()
            ->with(['division:id,name_en', 'items.item:id,item_code,name_en,unit_id', 'items.item.unit:id,name_en,symbol'])
            ->whereIn('division_id', $divisionIds)
            ->where('status', 'CONFIRMED')
            ->where('received_date', '>=', $from->toDateString())
            ->where('received_date', '<', $until->toDateString())
            ->orderBy('received_date')
            ->orderBy('id')
            ->get();

        foreach ($receipts as $receipt) {
            if ($receipt->items->isEmpty()) {
                continue;
            }

            $groups[$receipt->division_id] ??= [
                'division_id' => $receipt->division_id,
                'division_name' => $receipt->division?->name_en ?? '-',
                'received_items' => [],
                'issued_items' => [],
                'received_totals' => [],
                'issued_totals' => [],
                'receipt_subtotal' => 0,
                'receipt_vat' => 0,
                'receipt_total_with_vat' => 0,
            ];

            $calculatedSubtotal = $receipt->items->sum(
                fn ($line) => (float) $line->quantity_received * (float) ($line->unit_cost ?? 0)
            );
            $receiptSubtotal = (float) $receipt->subtotal;
            if ($receiptSubtotal <= 0 && $calculatedSubtotal > 0) {
                $receiptSubtotal = round($calculatedSubtotal, 2);
            }
            $receiptVat = (float) $receipt->vat_amount;
            if ($receiptVat <= 0 && $receiptSubtotal > 0 && (float) $receipt->vat_percentage > 0) {
                $receiptVat = round($receiptSubtotal * ((float) $receipt->vat_percentage / 100), 2);
            }
            $receiptTotal = (float) $receipt->total_with_vat;
            if ($receiptTotal <= 0 && ($receiptSubtotal > 0 || $receiptVat > 0)) {
                $receiptTotal = round($receiptSubtotal + $receiptVat, 2);
            }
            $groups[$receipt->division_id]['receipt_subtotal'] += $receiptSubtotal;
            $groups[$receipt->division_id]['receipt_vat'] += $receiptVat;
            $groups[$receipt->division_id]['receipt_total_with_vat'] += $receiptTotal;

            $vatRemaining = $receiptVat;
            $lastPricedReceiptItemId = $receipt->items->whereNotNull('unit_cost')->last()?->id;
            foreach ($receipt->items as $receiptItem) {
                $item = $receiptItem->item;
                $unit = $item?->unit;
                $unitKey = $item?->unit_id ?? 'unknown';
                $unitName = $unit?->symbol ?: ($unit?->name_en ?? 'Unit not specified');
                $lineSubtotal = (float) $receiptItem->quantity_received * (float) ($receiptItem->unit_cost ?? 0);
                $lineVat = 0;
                if ($receiptItem->unit_cost !== null && $receiptSubtotal > 0) {
                    $lineVat = $receiptItem->id === $lastPricedReceiptItemId
                        ? $vatRemaining
                        : round($receiptVat * ($lineSubtotal / $receiptSubtotal), 2);
                    $vatRemaining -= $lineVat;
                }
                $groups[$receipt->division_id]['received_items'][] = [
                    'item_code' => $item?->item_code ?? '-',
                    'item_name' => $item?->name_en ?? '-',
                    'supplier_name' => $receipt->supplier_name,
                    'reference_number' => $receipt->grn_number,
                    'date' => $receipt->received_date?->toDateString(),
                    'quantity' => (float) $receiptItem->quantity_received,
                    'unit' => $unitName,
                    'total_amount_with_vat' => $receiptItem->unit_cost === null
                        ? null
                        : round($lineSubtotal + $lineVat, 2),
                ];
                $groups[$receipt->division_id]['received_totals'][$unitKey] ??= [
                    'unit' => $unitName,
                    'quantity' => 0,
                ];
                $groups[$receipt->division_id]['received_totals'][$unitKey]['quantity'] += (float) $receiptItem->quantity_received;
            }
        }

        $issues = StockMovement::query()
            ->with(['division:id,name_en', 'item:id,item_code,name_en,unit_id', 'item.unit:id,name_en,symbol', 'stockRequest:id,request_number'])
            ->whereIn('division_id', $divisionIds)
            ->where('movement_type', 'ISSUE')
            ->where('created_at', '>=', $from)
            ->where('created_at', '<', $until)
            ->orderBy('created_at')
            ->orderBy('id')
            ->get();

        foreach ($issues as $movement) {
            $groups[$movement->division_id] ??= [
                'division_id' => $movement->division_id,
                'division_name' => $movement->division?->name_en ?? '-',
                'received_items' => [],
                'issued_items' => [],
                'received_totals' => [],
                'issued_totals' => [],
                'receipt_subtotal' => 0,
                'receipt_vat' => 0,
                'receipt_total_with_vat' => 0,
            ];
            $item = $movement->item;
            $unit = $item?->unit;
            $unitKey = $item?->unit_id ?? 'unknown';
            $unitName = $unit?->symbol ?: ($unit?->name_en ?? 'Unit not specified');
            $groups[$movement->division_id]['issued_items'][] = [
                'item_code' => $item?->item_code ?? '-',
                'item_name' => $item?->name_en ?? '-',
                'quantity' => (float) $movement->quantity,
                'unit' => $unitName,
                'date' => $movement->created_at?->toDateString(),
                'reference_number' => $movement->reference_number
                    ?? ($movement->reference_type === 'STOCK_REQUEST' ? $movement->stockRequest?->request_number : null),
            ];
            $groups[$movement->division_id]['issued_totals'][$unitKey] ??= [
                'unit' => $unitName,
                'quantity' => 0,
            ];
            $groups[$movement->division_id]['issued_totals'][$unitKey]['quantity'] += (float) $movement->quantity;
        }

        foreach ($groups as &$group) {
            $group['received_totals'] = array_values($group['received_totals']);
            $group['issued_totals'] = array_values($group['issued_totals']);
        }
        unset($group);

        $groups = array_values($groups);
        usort($groups, fn (array $left, array $right) => strcasecmp($left['division_name'], $right['division_name']));

        return $groups;
    }

    // ------------------------------------------------------------------
    // 5. Annual Report
    // ------------------------------------------------------------------

    public function annual(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->buildAnnualReportData($request)]);
    }

    public function annualPdf(Request $request): Response
    {
        $data = $this->buildAnnualReportData($request);
        $filters = $request->validate([
            'year' => ['required', 'integer', 'between:1900,2200'],
            'division_id' => ['sometimes', 'nullable', 'integer', 'exists:divisions,id'],
        ]);
        $visibleDivisionIds = $this->resolveDivisionIds($request);
        $selectedDivisionId = $request->filled('division_id')
            && $visibleDivisionIds->contains((int) $filters['division_id'])
                ? (int) $filters['division_id']
                : ($visibleDivisionIds->count() === 1 ? (int) $visibleDivisionIds->first() : null);
        $pdf = Pdf::loadView('reports.annual', [
            'divisions' => $data,
            'year' => (int) $filters['year'],
            'divisionName' => $selectedDivisionId
                ? Division::find($selectedDivisionId)?->name_en
                : 'All divisions',
            'generatedAt' => now(),
        ]);

        return $pdf->download('annual-report-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildAnnualReportData(Request $request): array
    {
        $filters = $request->validate([
            'year' => ['required', 'integer', 'between:1900,2200'],
            'division_id' => ['sometimes', 'nullable', 'integer', 'exists:divisions,id'],
        ]);
        $from = CarbonImmutable::create((int) $filters['year'], 1, 1)->startOfDay();
        $until = $from->addYear();

        return $this->buildInventoryTransactionReportData($request, $from, $until);
    }

    // ------------------------------------------------------------------
    // 6. Officer / DS Office Request Report
    // ------------------------------------------------------------------

    public function officerRequests(Request $request): JsonResponse
    {
        return response()->json(['data' => $this->buildOfficerReportData($request)]);
    }

    public function officerRequestsPdf(Request $request): Response
    {
        $data = $this->buildOfficerReportData($request);
        $pdf = Pdf::loadView('reports.officer-requests', [
            'groups' => $data,
            'from' => $request->input('date_from'),
            'to' => $request->input('date_to'),
            'generatedAt' => now(),
        ]);

        return $pdf->download('officer-requests-report-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildOfficerReportData(Request $request): \Illuminate\Support\Collection
    {
        $divisionIds = $this->resolveDivisionIds($request);

        $query = StockRequest::with(['division', 'requester.staffProfile', 'requester.organization', 'dsOffice', 'items.item'])
            ->whereIn('division_id', $divisionIds)
            ->latest();

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }
        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $requests = $query->get();

        return $requests
            ->groupBy(fn (StockRequest $r) => $r->division_id . '-' . $r->requester_id)
            ->map(function ($group) {
                $first = $group->first();
                $officerName = $first->dsOffice?->name_en
                    ?? $first->requester->organization?->name
                    ?? $first->requester->name
                    ?? $first->requester->username;
                return [
                    'officer_name' => $officerName,
                    'division_name' => $first->division?->name_en,
                    'requests' => $group->map(fn (StockRequest $r) => [
                        'request_number' => $r->request_number,
                        'division_name' => $r->division?->name_en,
                        'request_context' => $r->request_context,
                        'status' => $r->status,
                        'submitted_at' => $r->submitted_at?->toDateString(),
                        'item_count' => $r->items->count(),
                        'items' => $r->items->map(fn ($it) => [
                            'item_code' => $it->item->item_code,
                            'name_en' => $it->item->name_en,
                            'quantity_requested' => (float) $it->quantity_requested,
                        ])->values(),
                    ])->values(),
                ];
            })
            ->values();
    }
}
