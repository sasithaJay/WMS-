<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\StockMovement;
use Illuminate\Http\Request;

class StockMovementController extends Controller
{
    public function index(Request $request)
    {
        $user = auth()->user();
        $isCommissioner = $user->staffProfile?->role?->code === 'COMMISSIONER';

        $query = StockMovement::with(['item', 'performer'])
            ->latest();

        if (! $isCommissioner) {
            $query->where('division_id', $user->staffProfile?->division_id);
        }

        return $query->paginate($request->integer('per_page', 20));
    }
}