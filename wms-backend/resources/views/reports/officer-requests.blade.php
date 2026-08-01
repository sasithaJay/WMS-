
<!DOCTYPE html>
<html>
<head>
<style>
    body { font-family: sans-serif; font-size: 11px; color: #1e293b; }
    h1 { font-size: 22px; margin-bottom: 2px; color: #3280C4; }
    h2 { font-size: 16px; margin-bottom: 2px; color: #3280C4; }
    .meta { color: #64748b; font-size: 10px; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    th, td { text-align: left; padding: 6px 8px; border-bottom: 1px solid #e2e8f0; }
    th { background: #f8fafc; font-size: 10px; text-transform: uppercase; color: #64748b; }
    .officer-block { margin-bottom: 18px; }
    .officer-header { font-weight: bold; font-size: 12px; margin-bottom: 4px; }
</style>
</head>
<body>
    <h1>Social Welfare, Probation & Child Care Department</h1>
    <h2>Officer / DS Office Request Report</h2>
    <div class="meta">
        Period: {{ $from ?? 'All time' }} — {{ $to ?? 'Present' }} ·
        Generated: {{ $generatedAt->format('F j, Y g:i A') }}
    </div>
    @foreach ($groups as $group)
    <div class="officer-block">
        <div class="officer-header">{{ $group['officer_name'] }} ({{ $group['division_name'] }})</div>
        <table>
            <thead><tr><th>Request No.</th><th>Context</th><th>Status</th><th>Date</th><th>Items Count</th><th>Items</th></tr></thead>
            <tbody>
                @foreach ($group['requests'] as $r)
                <tr>
                    <td>{{ $r['request_number'] }}</td>
                    <td>{{ $r['request_context'] }}</td>
                    <td>{{ $r['status'] }}</td>
                    <td>{{ $r['submitted_at'] }}</td>
                    <td>{{ $r['item_count'] }}</td>
                    <td>
                        <ul style="margin:0; padding:0; list-style:none;">
                            @foreach ($r['items'] as $item)
                                <li>{{ $item['item_code'] }} - {{ $item['name_en'] }} ({{ $item['quantity_requested'] }})</li>
                            @endforeach
                        </ul>
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>
    </div>
    @endforeach
</body>
</html>