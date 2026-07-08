<?php

namespace Database\Seeders;

use App\Models\Permission;
use Illuminate\Database\Seeder;

class PermissionSeeder extends Seeder
{
    public function run(): void
    {
        $permissions = [
            [
                'name' => 'View Inventory',
                'code' => 'inventory.view',
                'description' =>
                    'View inventory items and stock levels.',
            ],

            [
                'name' => 'Manage Inventory',
                'code' => 'inventory.manage',
                'description' =>
                    'Create and update inventory items.',
            ],

            [
                'name' => 'Receive Stock',
                'code' => 'stock.receive',
                'description' =>
                    'Receive stock through GRN.',
            ],

            [
                'name' => 'Issue Stock',
                'code' => 'stock.issue',
                'description' =>
                    'Issue stock from the warehouse.',
            ],

            [
                'name' => 'View Stock Movements',
                'code' => 'stock.movements.view',
                'description' =>
                    'View stock movement history.',
            ],

            [
                'name' => 'Create Requests',
                'code' => 'requests.create',
                'description' =>
                    'Create item requests.',
            ],

            [
                'name' => 'View Own Requests',
                'code' => 'requests.own.view',
                'description' =>
                    'View own item requests.',
            ],

            [
                'name' => 'Recommend Requests',
                'code' => 'requests.recommend',
                'description' =>
                    'Recommend item requests.',
            ],

            [
                'name' => 'Approve Requests',
                'code' => 'requests.approve',
                'description' =>
                    'Approve item requests.',
            ],

            [
                'name' => 'Approve User Accounts',
                'code' => 'users.approve',
                'description' =>
                    'Approve or reject new user accounts.',
            ],

            [
                'name' => 'Manage Users',
                'code' => 'users.manage',
                'description' =>
                    'Manage system users.',
            ],

            [
                'name' => 'View Reports',
                'code' => 'reports.view',
                'description' =>
                    'View system reports.',
            ],
        ];

        foreach ($permissions as $permission) {
            Permission::updateOrCreate(
                [
                    'code' => $permission['code'],
                ],
                $permission
            );
        }
    }
}