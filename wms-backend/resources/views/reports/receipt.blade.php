
<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: sans-serif; font-size: 11px; color: #1e293b; }
    h1 { font-size: 16px; margin-bottom: 2px; }
    .meta { color: #64748b; font-size: 10px; margin-bottom: 16px; }
    table { width: 100%; table-layout: fixed; border-collapse: collapse; margin-bottom: 4px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; }
    .grn-block { margin-bottom: 18px; }
    .grn-header { font-weight: bold; font-size: 12px; margin-bottom: 4px; }
</style>
</head>
<body>
    @include('reports._department-header')
    <h1>Receipt Report</h1>
    <div class="meta">
        Period: {{ $from ?? 'All time' }} — {{ $to ?? 'Present' }} ·
        Generated: {{ $generatedAt->format('F j, Y g:i A') }}
    </div>
    @foreach ($rows as $receipt)
    <div class="grn-block">
        <div class="grn-header">{{ $receipt['grn_number'] }} — {{ $receipt['supplier_name'] }} ({{ $receipt['confirmed_at'] }})</div>
        <table width="100%" style="width:100%; table-layout:fixed;">
            <thead><tr><th width="38%">Division</th><th width="21%">Item Code</th><th width="25%">Item</th><th width="16%">Qty Received</th></tr></thead>
            <tbody>
                @foreach ($receipt['items'] as $item)
                <tr>
                    <td width="38%">{{ $receipt['division_name'] }}</td>
                    <td width="21%">{{ $item['item_code'] }}</td>
                    <td width="25%">{{ $item['name_en'] }}</td>
                    <td width="16%">{{ $item['quantity_received'] }}</td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endforeach
</body>
</html>
