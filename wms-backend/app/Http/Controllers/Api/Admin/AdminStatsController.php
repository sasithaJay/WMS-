<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Role;
use App\Models\User;
use App\Models\AdminActivityLog;
use App\Models\Backup;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Illuminate\Console\Scheduling\Schedule;

class AdminStatsController extends Controller
{
    public function index(): JsonResponse
    {
        $databaseStatus = 'online';
        try {
            DB::connection()->getPdo();
        } catch (\Throwable) {
            $databaseStatus = 'offline';
        }

        $latestBackup = Schema::hasTable('backups') ? Backup::latest()->first() : null;
        $schedulerConfigured = false;
        try {
            $schedulerConfigured = collect(app(Schedule::class)->events())
                ->contains(fn ($event) => str_contains((string) $event->command, 'stock:low-stock-alerts'));
        } catch (\Throwable) {
            // Keep the core admin metrics available if scheduler inspection fails.
        }
        $recentActivity = Schema::hasTable('admin_activity_logs')
            ? AdminActivityLog::with([
                'actor.staffProfile.role',
                'targetUser.staffProfile.role',
                'targetUser.organization',
            ])->latest()->limit(8)->get()->map(fn ($activity) => [
                'id' => $activity->id,
                'action' => $activity->action,
                'details' => $activity->details,
                'actor' => $activity->actor?->staffProfile?->full_name
                    ?? $activity->actor?->username
                    ?? 'Deleted user',
                'target' => $activity->targetUser?->staffProfile?->full_name
                    ?? $activity->targetUser?->organization?->name
                    ?? $activity->targetUser?->username
                    ?? 'Deleted user',
                'created_at' => $activity->created_at,
            ])
            : collect();

        return response()->json([
            'data' => [
                'total_users' => User::whereIn('account_status', ['ACTIVE', 'SUSPENDED'])->count(),
                'pending_users' => User::where('account_status', 'PENDING')->count(),
                'active_roles' => Role::where('is_active', true)->count(),
                'suspended_users' => User::where('account_status', 'SUSPENDED')->count(),
                'latest_backup' => $latestBackup ? [
                    'created_at' => $latestBackup->created_at,
                    'type' => $latestBackup->type,
                    'exists' => file_exists(storage_path('app/backups/' . $latestBackup->file_name)),
                ] : null,
                'system_status' => [
                    'database' => $databaseStatus,
                    'maintenance_mode' => app()->isDownForMaintenance(),
                    'low_stock_scheduler_configured' => $schedulerConfigured,
                ],
                'recent_activity' => $recentActivity,
            ],
        ]);
    }
}
