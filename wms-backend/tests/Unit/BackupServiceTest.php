<?php

namespace Tests\Unit;

use App\Services\BackupService;
use ReflectionMethod;
use Tests\TestCase;

class BackupServiceTest extends TestCase
{
    public function test_localhost_is_normalized_to_tcp_loopback_using_connection_details(): void
    {
        $service = new BackupService();
        $config = [
            'host' => 'localhost',
            'port' => '3310',
            'database' => 'wms',
            'username' => 'root',
            'password' => 'test-password',
            'unix_socket' => '',
        ];

        $createOptions = new ReflectionMethod($service, 'createMysqlOptionsFile');
        $optionsFile = $createOptions->invoke($service, $config);

        try {
            $options = file_get_contents($optionsFile);
            $this->assertStringContainsString('host="127.0.0.1"', $options);
            $this->assertStringContainsString('port="3310"', $options);
            $this->assertStringContainsString('protocol="TCP"', $options);
            $this->assertStringContainsString('password="test-password"', $options);

            $buildCommand = new ReflectionMethod($service, 'buildMysqldumpCommand');
            $command = $buildCommand->invoke($service, $config, $optionsFile);
            $this->assertSame('wms', $command[2]);
            $this->assertStringStartsWith('--defaults-extra-file=', $command[1]);
            $this->assertStringNotContainsString('test-password', implode(' ', $command));
        } finally {
            @unlink($optionsFile);
        }
    }
}
