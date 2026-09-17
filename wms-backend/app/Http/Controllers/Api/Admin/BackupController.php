<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Backup;
use App\Services\BackupService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Artisan;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Throwable;

class BackupController extends Controller
{
    public function __construct(protected BackupService $service)
    {
    }

    public function index(): JsonResponse
    {
        $backups = Backup::with('creator.staffProfile')->latest()->get();
        return response()->json(['data' => $backups]);
    }

    public function backupDatabase(Request $request): JsonResponse
    {
        try {
            $backup = $this->service->createDatabaseBackup($request->user()->id);
            return response()->json(['message' => 'Database backup created.', 'data' => $backup], 201);
        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Backup failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function backupUploads(Request $request): JsonResponse
    {
        try {
            $backup = $this->service->createUploadsBackup($request->user()->id);
            return response()->json(['message' => 'Uploads backup created.', 'data' => $backup], 201);
        } catch (Throwable $e) {
            report($e);
            return response()->json([
                'message' => 'Backup failed: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function download(Backup $backup): BinaryFileResponse
    {
        $path = $this->service->getFilePath($backup);
        abort_unless(file_exists($path), 404, 'File not found.');
        return response()->download($path, $backup->file_name);
    }

    public function destroy(Backup $backup): JsonResponse
    {
        $this->service->delete($backup);
        return response()->json(['message' => 'Backup deleted.']);
    }

    /**
     * Restore is the single most destructive operation in the system.
     * If ANYTHING goes wrong mid-restore, we guarantee the app comes back
     * out of maintenance mode rather than getting stuck down.
     */
    public function restore(Request $request, Backup $backup): JsonResponse
    {
        $request->validate([
            'confirmation' => ['required', 'in:RESTORE'],
        ]);

        Artisan::call('down', ['--render' => 'errors::503']);

        try {
            $this->service->restoreDatabase($backup);
        } catch (Throwable $e) {
            Artisan::call('up');
            report($e);
            return response()->json([
                'message' => 'Restore failed: ' . $e->getMessage(),
            ], 500);
        }

        Artisan::call('up');

        return response()->json(['message' => 'Database restored successfully.']);
    }

    public function maintenanceStatus(): JsonResponse
    {
        return response()->json(['data' => ['enabled' => app()->isDownForMaintenance()]]);
    }

    public function toggleMaintenance(Request $request): JsonResponse
    {
        $validated = $request->validate(['enabled' => ['required', 'boolean']]);

        if ($validated['enabled']) {
            Artisan::call('down', ['--render' => 'errors::503']);
        } else {
            Artisan::call('up');
        }

        return response()->json(['message' => 'Maintenance mode updated.', 'data' => $validated]);
    }
}