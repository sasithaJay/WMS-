<?php

namespace Database\Seeders;

use App\Models\Permission;
use App\Models\Role;
use Illuminate\Database\Seeder;
use RuntimeException;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        //Permission Map
        //Role code => permission codes
    
        $rolePermissions = [

            //Administrator
            'ADMIN' => [
                'users.approve',
                'users.manage',
                'reports.view',
            ],

            //Commissioner
            'COMMISSIONER' => [
                'inventory.view',
                'stock.movements.view',

                'requests.create',
                'requests.own.view',

                'requests.approve',
                'requests.adjust_approval',
                'requests.return_approval',
                'requests.reject_approval',

                'users.approve',
                'users.manage',
                'reports.view',
            ],

            //Store Keeper
            'STORE_KEEPER' => [
                'inventory.view',
                'inventory.manage',

                'requests.create',
                'requests.own.view',

                'stock.receive',
                'stock.issue',
                'stock.movements.view',

                'reports.view',
            ],

            //Assistant Commissioner
            'ASSISTANT_COMMISSIONER' => [
                'inventory.view',

                'requests.create',
                'requests.own.view',

                'requests.approve',
                'requests.adjust_approval',
                'requests.return_approval',
                'requests.reject_approval',

                'reports.view',
            ],

            //Assistant Director
            'ASSISTANT_DIRECTOR' => [
                'inventory.view',

                'requests.create',
                'requests.own.view',

                'requests.approve',
                'requests.adjust_approval',
                'requests.return_approval',
                'requests.reject_approval',

                'reports.view',
            ],

            //Administrative Officer
            'ADMINISTRATIVE_OFFICER' => [
                'inventory.view',

                'requests.create',
                'requests.own.view',

                'requests.recommend',
                'requests.adjust_recommendation',
                'requests.return_recommendation',
                'requests.reject_recommendation',

                'requests.approve',
                'requests.adjust_approval',
                'requests.return_approval',
                'requests.reject_approval',

                'reports.view',
            ],


            //Accountant
            'ACCOUNTANT' => [
                'inventory.view',

                'requests.create',
                'requests.own.view',

                'requests.approve',
                'requests.adjust_approval',
                'requests.return_approval',
                'requests.reject_approval',

                'reports.view',
            ],

            //Section Head
            'SECTION_HEAD' => [
                'inventory.view',

                'requests.create',
                'requests.own.view',

                'requests.recommend',
                'requests.adjust_recommendation',
                'requests.return_recommendation',
                'requests.reject_recommendation',
            ],

            //Development Officer
            'DEVELOPMENT_OFFICER' => [
                'inventory.view',
                'requests.create',
                'requests.own.view',
            ],

            //Other Officer
            'OTHER_OFFICER' => [
                'inventory.view',
                'requests.create',
                'requests.own.view',
            ],
        ];

        //Assign Permissions to Roles
        foreach ($rolePermissions as $roleCode => $permissionCodes) {

            $role = Role::where('code', $roleCode)->first();

            if (! $role) {
                $this->command?->warn(
                    "Role [{$roleCode}] does not exist. Skipping."
                );

                continue;
            }

            $permissions = Permission::whereIn(
                'code',
                $permissionCodes
            )->get();

            //Check if all permissions exist
            $foundPermissionCodes = $permissions
                ->pluck('code')
                ->all();

            $missingPermissionCodes = array_diff(
                $permissionCodes,
                $foundPermissionCodes
            );

            if (! empty($missingPermissionCodes)) {
                throw new RuntimeException(
                    "Missing permissions for role [{$roleCode}]: "
                    . implode(', ', $missingPermissionCodes)
                );
            }

            //Sync permissions to role
            $role->permissions()->sync(
                $permissions->pluck('id')->all()
            );

            $this->command?->info(
                "Permissions assigned to {$roleCode}."
            );
        }
    }
}