<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        return StockMovement::with([
                'item',
                'performer',
            ])
            ->latest()
            ->paginate(
                $request->integer('per_page', 20)
            );
    }
}