@include('reports.monthly', [
    'reportTitle' => 'Annual Inventory Transactions',
    'periodLabel' => (string) $year,
    'emptyDescription' => 'No inventory transactions match the selected year and division.',
])
