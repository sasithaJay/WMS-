
<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: sans-serif; font-size: 11px; color: #1e293b; }
    h1 { font-size: 16px; margin-bottom: 2px; }
    .meta { color: #64748b; font-size: 10px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; }
</style>
</head>
<body>
    @include('reports._department-header')
    <h1>Issue Report</h1>
    <div class="meta">
        Period: {{ $from ?? 'All time' }} — {{ $to ?? 'Present' }} ·
        Generated: {{ $generatedAt->format('F j, Y g:i A') }}
    </div>
    <table>
        <thead>
            <tr><th>Date</th><th>Division</th><th>Item Code</th><th>Item</th><th>Qty</th><th>Reference</th><th>Requester</th><th>Issued By</th></tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
            <tr>
                <td>{{ $row['date'] }}</td>
                <td>{{ $row['division_name'] }}</td>
                <td>{{ $row['item_code'] }}</td>
                <td>{{ $row['item_name'] }}</td>
                <td>{{ $row['quantity'] }}</td>
                <td>{{ $row['reference_number'] }}</td>
                <td>{{ $row['requester_name'] }}<br><span style="color:#64748b; font-size:9px;">{{ $row['requester_position'] }}</span></td>
                <td>{{ $row['performed_by'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
