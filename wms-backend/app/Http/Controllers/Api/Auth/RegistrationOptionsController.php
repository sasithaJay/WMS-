<?php

namespace App\Http\Controllers\Api\Auth;

use App\Http\Controllers\Controller;
use App\Models\Division;
use App\Models\InstitutionType;
use App\Models\Role;
use App\Models\Section;
use App\Models\DsOffice;
use App\Models\Institution;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegistrationOptionsController extends Controller
{
    public function index(): JsonResponse
    {
        return response()->json([
            'divisions' => Division::query()
                ->where('is_active', true)
                ->select(
                    'id',
                    'code',
                    'name_en',
                    'name_si'
                )
                ->orderBy('id')
                ->get(),

            'roles' => Role::query()
                ->where('is_active', true)
                ->whereNotIn('code', [
                    'ADMIN',
                    'COMMISSIONER',
                ])
                ->select(
                    'id',
                    'code',
                    'name_en',
                    'name_si'
                )
                ->orderBy('id')
                ->get(),

            'institution_types' =>
                InstitutionType::query()
                    ->where('is_active', true)
                    ->select(
                        'id',
                        'name_en',
                        'name_si'
                    )
                    ->orderBy('id')
                    ->get(),

            'institutions' => Institution::query()
                ->where('is_active', true)
                ->select('id', 'division_id', 'code', 'name_en', 'name_si', 'district')
                ->orderBy('name_en')
                ->get(),

            'ds_offices' => DsOffice::query()
                ->where('is_active', true)
                ->select(
                    'id',
                    'name_en',
                    'name_si',
                    'code',
                    'district'
                )
                ->orderBy('name_en')
                ->get(),
        ]);
    }

    public function sections(
        Request $request
    ): JsonResponse {
        $validated = $request->validate([
            'division_id' => [
                'required',
                'integer',
                'exists:divisions,id',
            ],
        ]);

        $sections = Section::query()
            ->where(
                'division_id',
                $validated['division_id']
            )
            ->where('is_active', true)
            ->select(
                'id',
                'division_id',
                'code',
                'name_en',
                'name_si'
            )
            ->orderBy('id')
            ->get();

        return response()->json([
            'sections' => $sections,
        ]);
    }
}