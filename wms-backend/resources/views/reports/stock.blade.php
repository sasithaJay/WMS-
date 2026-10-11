
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
    .status-out { color: #dc2626; font-weight: bold; }
    .status-low { color: #d97706; font-weight: bold; }
    .status-normal { color: #16a34a; }
</style>
</head>
<body>
    @include('reports._department-header')
    <h1>Current Stock Report</h1>
    <div class="meta">Generated: {{ $generatedAt->format('F j, Y g:i A') }}</div>
    <table>
        <thead>
            <tr>
                <th>Division</th><th>Code</th><th>Item</th><th>Category</th><th>Unit</th>
                <th>On Hand</th><th>Reorder Level</th><th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach ($rows as $row)
            <tr>
                <td>{{ $row['division_name'] }}</td>
                <td>{{ $row['item_code'] }}</td>
                <td>{{ $row['name_en'] }}</td>
                <td>{{ $row['category'] }}</td>
                <td>{{ $row['unit'] }}</td>
                <td>{{ $row['quantity_on_hand'] }}</td>
                <td>{{ $row['reorder_level'] }}</td>
                <td class="status-{{ strtolower($row['status']) }}">{{ $row['status'] }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
</body>
</html>
