<?php

namespace App\Services;

use App\Models\Backup;
use Illuminate\Support\Facades\DB;
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
        $optionsFile = $this->createMysqlOptionsFile($config);

        try {
            $process = new Process($this->buildMysqldumpCommand($config, $optionsFile));
            $process->setTimeout(300);

            $output = fopen($tempPath, 'wb');
            if ($output === false) {
                throw new \RuntimeException('Could not open the temporary database backup file.');
            }

            try {
                $process->run(function ($type, $buffer) use ($output) {
                    if ($type === Process::OUT) {
                        fwrite($output, $buffer);
                    }
                });
            } finally {
                fclose($output);
            }

            if (! $process->isSuccessful()) {
                // On some Windows setups the bundled MySQL client cannot
                // initialize Winsock even though Laravel already has a live
                // database connection. Use that connection to produce the
                // same portable SQL artifact instead of failing the backup.
                $this->writeDatabaseDumpFromConnection($tempPath);
            }

            $zipFileName = 'backup_db_' . now()->format('Y-m-d_H-i-s') . '.zip';
            $zipPath = storage_path('app/' . self::DIR . '/' . $zipFileName);
            $zip = new ZipArchive();

            if ($zip->open($zipPath, ZipArchive::CREATE) !== true) {
                throw new \RuntimeException('Could not create backup ZIP file.');
            }

            $zip->addFile($tempPath, $fileName);
            $zip->close();

            return Backup::create([
                'file_name' => $zipFileName,
                'type' => 'DATABASE',
                'file_size' => filesize($zipPath),
                'created_by' => $userId,
            ]);
        } finally {
            @unlink($optionsFile);
            @unlink($tempPath);
        }
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

        $optionsFile = null;
        try {
            if ($this->isConnectionDump($sqlFiles[0])) {
                $this->restoreDatabaseFromConnectionDump($sqlFiles[0]);
            } else {
                $optionsFile = $this->createMysqlOptionsFile($config);
                $process = new Process($this->buildMysqlCommand($config, $optionsFile));
                $sqlInput = fopen($sqlFiles[0], 'r');
                if ($sqlInput === false) {
                    throw new \RuntimeException('Could not read the SQL file from this backup.');
                }
                $process->setInput($sqlInput);
                $process->setTimeout(600);
                try {
                    $process->run();
                } finally {
                    fclose($sqlInput);
                }

                if (! $process->isSuccessful()) {
                    throw new ProcessFailedException($process);
                }
            }
        } finally {
            if ($optionsFile !== null) {
                @unlink($optionsFile);
            }
            $this->cleanupDir($extractDir);
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

    private function buildMysqldumpCommand(array $config, string $optionsFile): array
    {
        return [
            config('services.mysql_tools.mysqldump'),
            '--defaults-extra-file=' . $optionsFile,
            $config['database'],
        ];
    }

    private function buildMysqlCommand(array $config, string $optionsFile): array
    {
        return [
            config('services.mysql_tools.mysql'),
            '--defaults-extra-file=' . $optionsFile,
            $config['database'],
        ];
    }

    private function createMysqlOptionsFile(array $config): string
    {
        $this->ensureDirectoryExists();

        $host = trim((string) ($config['host'] ?? '127.0.0.1'));
        $localHosts = ['localhost', 'localhost.localdomain', '127.0.0.1', '::1'];
        $isLocalHost = in_array(strtolower($host), $localHosts, true);
        $socket = trim((string) ($config['unix_socket'] ?? ''));
        $options = [
            'user' => (string) ($config['username'] ?? ''),
            'password' => (string) ($config['password'] ?? ''),
        ];

        if ($socket !== '') {
            $options['socket'] = $socket;
        } else {
            // Avoid Windows resolver failures for the localhost alias while
            // connecting to the same local MySQL instance over TCP.
            $options['host'] = $isLocalHost ? '127.0.0.1' : $host;
            $options['port'] = (string) ($config['port'] ?? 3306);
            if ($isLocalHost) {
                $options['protocol'] = 'TCP';
            }
        }

        $contents = "[client]\n";
        foreach ($options as $name => $value) {
            $escaped = str_replace(
                ['\\', '"', "\r", "\n"],
                ['\\\\', '\\"', '\\r', '\\n'],
                $value,
            );
            $contents .= $name . '="' . $escaped . "\"\n";
        }

        $path = tempnam(storage_path('app/' . self::DIR), '.mysql-client-');
        if ($path === false || file_put_contents($path, $contents, LOCK_EX) === false) {
            throw new \RuntimeException('Could not create temporary MySQL client settings.');
        }
        @chmod($path, 0600);

        return $path;
    }

    private function writeDatabaseDumpFromConnection(string $path): void
    {
        $connection = DB::connection();
        $pdo = $connection->getPdo();
        $stream = fopen($path, 'wb');
        if ($stream === false) {
            throw new \RuntimeException('Could not open the temporary database backup file.');
        }

        try {
            fwrite($stream, "-- WMS_PDO_BACKUP_V1\nSET NAMES utf8mb4;\nSET FOREIGN_KEY_CHECKS=0;\n\n");

            $tables = $connection->select('SHOW FULL TABLES');
            $tableNames = [];
            $views = [];

            foreach ($tables as $row) {
                $values = array_values((array) $row);
                $name = (string) ($values[0] ?? '');
                $type = strtoupper((string) ($values[1] ?? 'BASE TABLE'));
                if ($name === '') {
                    continue;
                }
                if ($type === 'VIEW') {
                    $views[] = $name;
                } else {
                    $tableNames[] = $name;
                }
            }

            foreach ($tableNames as $table) {
                $quotedTable = $this->quoteIdentifier($table);
                fwrite($stream, "DROP TABLE IF EXISTS {$quotedTable};\n");
                $create = $connection->selectOne('SHOW CREATE TABLE ' . $quotedTable);
                $createSql = array_values((array) $create)[1] ?? null;
                if (! is_string($createSql)) {
                    throw new \RuntimeException("Could not read the definition for table {$table}.");
                }
                fwrite($stream, $createSql . ";\n");

                $columns = $connection->select('SHOW FULL COLUMNS FROM ' . $quotedTable);
                $columnNames = [];
                $binaryColumns = [];
                foreach ($columns as $column) {
                    $column = (array) $column;
                    $columnName = (string) ($column['Field'] ?? '');
                    $columnNames[] = $columnName;
                    if (preg_match('/\\b(binary|varbinary|tinyblob|blob|mediumblob|longblob|bit|geometry|point|linestring|polygon)\\b/i', (string) ($column['Type'] ?? ''))) {
                        $binaryColumns[$columnName] = true;
                    }
                }

                $statement = $pdo->query('SELECT * FROM ' . $quotedTable);
                while (($record = $statement->fetch(\PDO::FETCH_ASSOC)) !== false) {
                    $values = [];
                    foreach ($columnNames as $columnName) {
                        $value = $record[$columnName] ?? null;
                        if ($value === null) {
                            $values[] = 'NULL';
                        } elseif (isset($binaryColumns[$columnName])) {
                            $values[] = '0x' . bin2hex((string) $value);
                        } else {
                            $quotedValue = $pdo->quote((string) $value);
                            if ($quotedValue === false) {
                                throw new \RuntimeException('Could not encode a database value for the backup.');
                            }
                            $values[] = $quotedValue;
                        }
                    }

                    $quotedColumns = implode(', ', array_map(fn ($column) => $this->quoteIdentifier($column), $columnNames));
                    fwrite($stream, 'INSERT INTO ' . $quotedTable . ' (' . $quotedColumns . ') VALUES (' . implode(', ', $values) . ");\n");
                }
                $statement->closeCursor();
                fwrite($stream, "\n");
            }

            foreach ($views as $view) {
                $quotedView = $this->quoteIdentifier($view);
                $create = $connection->selectOne('SHOW CREATE VIEW ' . $quotedView);
                $createValues = array_values((array) $create);
                $createSql = $createValues[1] ?? null;
                if (! is_string($createSql)) {
                    throw new \RuntimeException("Could not read the definition for view {$view}.");
                }
                fwrite($stream, 'DROP VIEW IF EXISTS ' . $quotedView . ";\n" . $createSql . ";\n\n");
            }

            fwrite($stream, "SET FOREIGN_KEY_CHECKS=1;\n");
        } finally {
            fclose($stream);
        }
    }

    private function quoteIdentifier(string $identifier): string
    {
        return '`' . str_replace('`', '``', $identifier) . '`';
    }

    private function isConnectionDump(string $path): bool
    {
        $stream = fopen($path, 'r');
        if ($stream === false) {
            throw new \RuntimeException('Could not read the SQL file from this backup.');
        }

        try {
            $firstLine = fgets($stream);
            if ($firstLine === "-- WMS_PDO_BACKUP_V1\n" || $firstLine === "-- WMS_PDO_BACKUP_V1\r\n") {
                return true;
            }

            // Backups created by the earlier PDO fallback used these first
            // two statements before the marker was introduced.
            $secondLine = fgets($stream);
            return trim((string) $firstLine) === 'SET NAMES utf8mb4;'
                && trim((string) $secondLine) === 'SET FOREIGN_KEY_CHECKS=0;';
        } finally {
            fclose($stream);
        }
    }

    private function restoreDatabaseFromConnectionDump(string $path): void
    {
        $pdo = DB::connection()->getPdo();
        $stream = fopen($path, 'r');
        if ($stream === false) {
            throw new \RuntimeException('Could not read the SQL file from this backup.');
        }

        $statement = '';
        $quote = null;
        try {
            while (($line = fgets($stream)) !== false) {
                if ($statement === '' && preg_match('/^\s*--/', $line)) {
                    continue;
                }

                $length = strlen($line);
                for ($index = 0; $index < $length; $index++) {
                    $character = $line[$index];
                    $statement .= $character;

                    if ($quote !== null) {
                        if ($character === '\\' && $index + 1 < $length) {
                            $statement .= $line[++$index];
                        } elseif ($character === $quote) {
                            if ($index + 1 < $length && $line[$index + 1] === $quote) {
                                $statement .= $line[++$index];
                            } else {
                                $quote = null;
                            }
                        }
                    } elseif ($character === "'" || $character === '"' || $character === '`') {
                        $quote = $character;
                    } elseif ($character === ';') {
                        $sql = trim($statement);
                        if ($sql !== '') {
                            $pdo->exec($sql);
                        }
                        $statement = '';
                    }
                }
            }

            if (trim($statement) !== '') {
                throw new \RuntimeException('The database backup contains an incomplete SQL statement.');
            }
        } finally {
            fclose($stream);
            // Restores may fail partway through; never leave this connection
            // with foreign-key checks disabled for the rest of the request.
            $pdo->exec('SET FOREIGN_KEY_CHECKS=1');
        }
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
