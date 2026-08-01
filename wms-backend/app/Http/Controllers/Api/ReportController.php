<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\Item;
use App\Models\StockMovement;
use App\Models\StockReceipt;
use App\Models\StockRequest;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
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
        $divisionIds = $this->resolveDivisionIds($request);

        return Item::query()
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
        $divisionIds = $this->resolveDivisionIds($request);

        $query = StockMovement::with(['item', 'performer'])
            ->whereIn('division_id', $divisionIds)
            ->where('movement_type', 'ISSUE')
            ->latest();

        if ($request->filled('date_from')) {
            $query->whereDate('created_at', '>=', $request->input('date_from'));
        }
        if ($request->filled('date_to')) {
            $query->whereDate('created_at', '<=', $request->input('date_to'));
        }

        return $query->get()->map(fn (StockMovement $m) => [
            'date' => $m->created_at->toDateString(),
            'item_code' => $m->item->item_code,
            'item_name' => $m->item->name_en,
            'quantity' => (float) $m->quantity,
            'reference_number' => $m->reference_number,
            'performed_by' => $m->performer->name ?? $m->performer->username,
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

        $query = StockReceipt::with(['items.item'])
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
        $pdf = Pdf::loadView('reports.monthly', [
            'rows' => $data,
            'year' => $request->integer('year', now()->year),
            'generatedAt' => now(),
        ]);

        return $pdf->download('monthly-report-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildMonthlyReportData(Request $request): array
    {
        $divisionIds = $this->resolveDivisionIds($request);
        $year = $request->integer('year', now()->year);

        $movementRows = StockMovement::whereIn('division_id', $divisionIds)
            ->whereYear('created_at', $year)
            ->selectRaw("MONTH(created_at) as m, movement_type, SUM(quantity) as total")
            ->groupBy('m', 'movement_type')
            ->get();

        $requestRows = StockRequest::whereIn('division_id', $divisionIds)
            ->whereYear('created_at', $year)
            ->selectRaw("MONTH(created_at) as m, status, COUNT(*) as total")
            ->groupBy('m', 'status')
            ->get();

        $incomingTypes = ['RECEIPT', 'RETURN', 'ADJUSTMENT_IN'];
        $outgoingTypes = ['ISSUE', 'ADJUSTMENT_OUT'];
        $pendingStatuses = ['PENDING_RECOMMENDATION', 'PENDING_APPROVAL'];

        $months = [];
        for ($m = 1; $m <= 12; $m++) {
            $received = $movementRows->where('m', $m)->whereIn('movement_type', $incomingTypes)->sum('total');
            $issued = $movementRows->where('m', $m)->whereIn('movement_type', $outgoingTypes)->sum('total');
            $pending = $requestRows->where('m', $m)->whereIn('status', $pendingStatuses)->sum('total');
            $rejected = $requestRows->where('m', $m)->where('status', 'REJECTED')->sum('total');

            $months[] = [
                'month' => $m,
                'month_name' => now()->setDate($year, $m, 1)->translatedFormat('F Y'),
                'received' => (float) $received,
                'issued' => (float) $issued,
                'pending' => (int) $pending,
                'rejected' => (int) $rejected,
            ];
        }

        return $months;
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
        $pdf = Pdf::loadView('reports.annual', ['rows' => $data, 'generatedAt' => now()]);

        return $pdf->download('annual-report-' . now()->format('Y-m-d') . '.pdf');
    }

    private function buildAnnualReportData(Request $request): array
    {
        $divisionIds = $this->resolveDivisionIds($request);

        $fromYear = $request->integer('from_year', now()->year - 2);
        $toYear = $request->integer('to_year', now()->year);

        $incomingTypes = ['RECEIPT', 'RETURN', 'ADJUSTMENT_IN'];
        $outgoingTypes = ['ISSUE', 'ADJUSTMENT_OUT'];

        $movementRows = StockMovement::whereIn('division_id', $divisionIds)
            ->whereBetween(DB::raw('YEAR(created_at)'), [$fromYear, $toYear])
            ->selectRaw('YEAR(created_at) as y, movement_type, SUM(quantity) as total')
            ->groupBy('y', 'movement_type')
            ->get();

        $requestRows = StockRequest::whereIn('division_id', $divisionIds)
            ->whereBetween(DB::raw('YEAR(created_at)'), [$fromYear, $toYear])
            ->selectRaw('YEAR(created_at) as y, status, COUNT(*) as total')
            ->groupBy('y', 'status')
            ->get();

        $years = [];
        for ($y = $toYear; $y >= $fromYear; $y--) {
            $totalReceived = $movementRows->where('y', $y)->whereIn('movement_type', $incomingTypes)->sum('total');
            $totalIssued = $movementRows->where('y', $y)->whereIn('movement_type', $outgoingTypes)->sum('total');
            $totalRequests = $requestRows->where('y', $y)->sum('total');
            $fulfilled = $requestRows->where('y', $y)->where('status', 'ISSUED')->sum('total');

            $years[] = [
                'year' => $y,
                'total_received' => (float) $totalReceived,
                'total_issued' => (float) $totalIssued,
                'total_requests' => (int) $totalRequests,
                'fulfilled' => (int) $fulfilled,
            ];
        }

        return $years;
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

        $query = StockRequest::with(['requester.staffProfile', 'requester.organization', 'dsOffice', 'items.item'])
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
            ->groupBy(fn (StockRequest $r) => $r->dsOffice?->name_en
                ?? $r->requester->organization?->name
                ?? $r->requester->name
                ?? $r->requester->username)
            ->map(function ($group, $officerName) {
                return [
                    'officer_name' => $officerName,
                    'division_name' => $group->first()->division->name_en ?? null,
                    'requests' => $group->map(fn (StockRequest $r) => [
                        'request_number' => $r->request_number,
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