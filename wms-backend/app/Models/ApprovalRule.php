<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ApprovalRule extends Model
{
    protected $fillable = [
        'division_id',
        'requester_role_id',
        'organization_kind',
        'request_context',
        'approver_role_id',
        'priority',
    ];
}
