<?php

namespace App\Services;

use App\Models\Backup;
use Symfony\Component\Process\Process;
use Symfony\Component\Process\Exception\ProcessFailedException;
use ZipArchive;

class BackupService
{
    private const DIR = 'backups';

    public function createDatabaseBackup(int $userId): Backup
    {
        $config = config('database.connections.' . config('database.default'));
        $fileName = 'backup_db_' . now()->format('Y-m-d_H-i-s') . '.sql';
        $tempPath = storage_path('app/' . self::DIR . '/' . $fileName);

        $this->ensureDirectoryExists();

        $process = new Process($this->buildMysqldumpCommand($config));
        $process->setTimeout(300);
        $process->run(function ($type, $buffer) use ($tempPath) {
            file_put_contents($tempPath, $buffer, FILE_APPEND);
        });

        if (! $process->isSuccessful()) {
            @unlink($tempPath);
            throw new ProcessFailedException($process);
        }

        $zipFileName = 'backup_db_' . now()->format('Y-m-d_H-i-s') . '.zip';
        $zipPath = storage_path('app/' . self::DIR . '/' . $zipFileName);

        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE);
        $zip->addFile($tempPath, $fileName);
        $zip->close();
        unlink($tempPath);

        return Backup::create([
            'file_name' => $zipFileName,
            'type' => 'DATABASE',
            'file_size' => filesize($zipPath),
            'created_by' => $userId,
        ]);
    }

    public function createUploadsBackup(int $userId): Backup
    {
        $this->ensureDirectoryExists();

        $fileName = 'backup_uploads_' . now()->format('Y-m-d_H-i-s') . '.zip';
        $zipPath = storage_path('app/' . self::DIR . '/' . $fileName);
        $sourceDir = storage_path('app/public');

        $zip = new ZipArchive();
        $zip->open($zipPath, ZipArchive::CREATE);

        if (is_dir($sourceDir)) {
            $files = new \RecursiveIteratorIterator(
                new \RecursiveDirectoryIterator($sourceDir),
                \RecursiveIteratorIterator::LEAVES_ONLY
            );

            foreach ($files as $file) {
                if (! $file->isDir()) {
                    $relativePath = substr($file->getRealPath(), strlen($sourceDir) + 1);
                    $zip->addFile($file->getRealPath(), $relativePath);
                }
            }
        }

        $zip->close();

        return Backup::create([
            'file_name' => $fileName,
            'type' => 'UPLOADS',
            'file_size' => filesize($zipPath),
            'created_by' => $userId,
        ]);
    }

    public function restoreDatabase(Backup $backup): void
    {
        if ($backup->type !== 'DATABASE') {
            abort(422, 'This backup is not a database backup.');
        }

        $zipPath = storage_path('app/' . self::DIR . '/' . $backup->file_name);

        if (! file_exists($zipPath)) {
            abort(404, 'Backup file not found on disk.');
        }

        $extractDir = storage_path('app/' . self::DIR . '/tmp_restore_' . time());
        mkdir($extractDir, 0755, true);

        $zip = new ZipArchive();
        $zip->open($zipPath);
        $zip->extractTo($extractDir);
        $zip->close();

        $sqlFiles = glob($extractDir . '/*.sql');

        if (empty($sqlFiles)) {
            $this->cleanupDir($extractDir);
            abort(422, 'No .sql file found inside this backup.');
        }

        $config = config('database.connections.' . config('database.default'));

        $process = new Process($this->buildMysqlCommand($config));
        $process->setInput(fopen($sqlFiles[0], 'r'));
        $process->setTimeout(600);
        $process->run();

        $this->cleanupDir($extractDir);

        if (! $process->isSuccessful()) {
            throw new ProcessFailedException($process);
        }
    }

    public function delete(Backup $backup): void
    {
        $path = storage_path('app/' . self::DIR . '/' . $backup->file_name);
        if (file_exists($path)) {
            unlink($path);
        }
        $backup->delete();
    }

    public function getFilePath(Backup $backup): string
    {
        return storage_path('app/' . self::DIR . '/' . $backup->file_name);
    }

    /**
     * Builds the mysqldump command array, using the configured binary path
     * (falls back to plain "mysqldump" on Linux where it's already on PATH)
     * and omitting --password entirely when empty, since some MySQL builds
     * reject a blank --password= flag rather than treating it as no password.
     */
    // private function buildMysqldumpCommand(array $config): array
    // {
    //     $args = [
    //         config('services.mysql_tools.mysqldump'),
    //         '--host=' . $config['host'],
    //         '--port=' . $config['port'],
    //         '--user=' . $config['username'],
    //     ];

    //     if (! empty($config['password'])) {
    //         $args[] = '--password=' . $config['password'];
    //     }

    //     $args[] = $config['database'];

    //     return $args;
    // }
    private function buildMysqldumpCommand(array $config): array
    {
        $mysqldump = config('services.mysql_tools.mysqldump');

        return [
            $mysqldump,
            '--protocol=tcp',
            '--host=127.0.0.1',
            '--port=3306',
            '--user=' . $config['username'],
            $config['database'],
        ];
    }

    // private function buildMysqlCommand(array $config): array
    // {
    //     $args = [
    //         config('services.mysql_tools.mysql'),
    //         '--host=' . $config['host'],
    //         '--port=' . $config['port'],
    //         '--user=' . $config['username'],
    //     ];

    //     if (! empty($config['password'])) {
    //         $args[] = '--password=' . $config['password'];
    //     }

    //     $args[] = $config['database'];

    //     return $args;
    // }
    private function buildMysqlCommand(array $config): array
    {
        $mysql = config('services.mysql_tools.mysql');

        return [
            $mysql,
            '--protocol=tcp',
            '--host=127.0.0.1',
            '--port=3306',
            '--user=' . $config['username'],
            $config['database'],
        ];
    }

    private function ensureDirectoryExists(): void
    {
        $dir = storage_path('app/' . self::DIR);
        if (! is_dir($dir)) {
            mkdir($dir, 0755, true);
        }
    }

    private function cleanupDir(string $dir): void
    {
        $files = glob($dir . '/*');
        foreach ($files as $file) {
            is_dir($file) ? $this->cleanupDir($file) : unlink($file);
        }
        @rmdir($dir);
    }
}