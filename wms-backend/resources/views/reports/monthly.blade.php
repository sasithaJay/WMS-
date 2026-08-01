
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
    <h1>Monthly Report — {{ $year }}</h1>
    <div class="meta">Generated: {{ $generatedAt->format('F j, Y g:i A') }}</div>
    <table>
        <thead><tr><th>Month</th><th>Received</th><th>Issued</th><th>Pending</th><th>Rejected</th></tr></thead>
        <tbody>
            @foreach ($rows as $row)
            <tr>
                <td>{{ $row['month_name'] }}</td>
                <td>{{ $row['received'] }}</td>
                <td>{{ $row['issued'] }}</td>
                <td>{{ $row['pending'] }}</td>
                <td>{{ $row['rejected'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>