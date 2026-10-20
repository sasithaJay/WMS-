<!DOCTYPE html>
<html>
<head>
<style>
    @page { margin: 28px; }
    body { font-family: sans-serif; font-size: 10px; color: #1e293b; }
    h1 { font-size: 18px; margin: 10px 0 4px; }
    h2 { font-size: 14px; margin: 0; padding: 8px 10px; background: #f1f5f9; border-bottom: 1px solid #cbd5e1; }
    h3 { font-size: 11px; margin: 12px 0 5px; color: #047857; }
    h3.issued { color: #1d4ed8; }
    .meta { color: #64748b; font-size: 10px; margin-bottom: 14px; }
    .division { margin-bottom: 18px; page-break-inside: avoid; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    th, td { text-align: left; padding: 5px 6px; border-bottom: 1px solid #e2e8f0; vertical-align: top; }
    th { background: #f8fafc; font-size: 9px; text-transform: uppercase; color: #64748b; }
    .number { text-align: right; white-space: nowrap; }
    .total { text-align: right; font-weight: bold; padding: 5px 6px; color: #334155; }
    .empty { color: #94a3b8; font-style: italic; padding: 6px; }
    .no-results { padding: 24px; text-align: center; color: #64748b; border: 1px dashed #cbd5e1; }
    .report-total { margin-top: 10px; padding: 10px; text-align: right; background: #f8fafc; border: 1px solid #cbd5e1; font-size: 11px; }
</style>
</head>
<body>
    @include('reports._department-header')
    <h1>{{ $reportTitle ?? 'Monthly Inventory Transactions' }}</h1>
    <div class="meta">{{ $periodLabel ?? ($monthName . ' ' . $year) }} · {{ $divisionName }} · Generated {{ $generatedAt->format('F j, Y g:i A') }}</div>

    @forelse ($divisions as $division)
    <section class="division">
        <h2>{{ $division['division_name'] }}</h2>
        <h3>Received Items</h3>
        @if (count($division['received_items']))
        <table>
            <thead><tr><th>Item Code</th><th>Item Name</th><th>Supplier</th><th>GRN / Reference</th><th>Received Date</th><th class="number">Quantity</th><th>Unit</th><th class="number">Total Amount with VAT (Rs.)</th></tr></thead>
            <tbody>
                @foreach ($division['received_items'] as $item)
                <tr><td>{{ $item['item_code'] }}</td><td>{{ $item['item_name'] }}</td><td>{{ $item['supplier_name'] }}</td><td>{{ $item['reference_number'] ?? '—' }}</td><td>{{ $item['date'] ?? '—' }}</td><td class="number">{{ number_format($item['quantity'], 3) }}</td><td>{{ $item['unit'] }}</td><td class="number">{{ $item['total_amount_with_vat'] === null ? '—' : 'Rs. ' . number_format($item['total_amount_with_vat'], 2) }}</td></tr>
                @endforeach
            </tbody>
        </table>
        <div class="total">Total received: @foreach ($division['received_totals'] as $total){{ number_format($total['quantity'], 3) }} {{ $total['unit'] }}@if (!$loop->last) · @endif @endforeach</div>
        @else
        <div class="empty">No items received in this period.</div>
        @endif

        <h3 class="issued">Issued Items</h3>
        @if (count($division['issued_items']))
        <table>
            <thead><tr><th>Item Code</th><th>Item Name</th><th class="number">Quantity</th><th>Unit</th><th>Issue Date</th><th>Request / Issue Reference</th></tr></thead>
            <tbody>
                @foreach ($division['issued_items'] as $item)
                <tr><td>{{ $item['item_code'] }}</td><td>{{ $item['item_name'] }}</td><td class="number">{{ number_format($item['quantity'], 3) }}</td><td>{{ $item['unit'] }}</td><td>{{ $item['date'] ?? '—' }}</td><td>{{ $item['reference_number'] ?? '—' }}</td></tr>
                @endforeach
            </tbody>
        </table>
        <div class="total">Total issued: @foreach ($division['issued_totals'] as $total){{ number_format($total['quantity'], 3) }} {{ $total['unit'] }}@if (!$loop->last) · @endif @endforeach</div>
        @else
        <div class="empty">No items issued in this period.</div>
        @endif
        @if (count($division['received_items']))
        <div class="report-total">
            <div>GRN subtotal for this division: Rs. {{ number_format($division['receipt_subtotal'], 2) }}</div>
            <div>VAT: Rs. {{ number_format($division['receipt_vat'], 2) }}</div>
            <strong>Division total with VAT: Rs. {{ number_format($division['receipt_total_with_vat'], 2) }}</strong>
        </div>
        @endif
    </section>
    @empty
    <div class="no-results">{{ $emptyDescription ?? 'No inventory transactions match the selected month, year, and division.' }}</div>
    @endforelse

</body>
</html>
