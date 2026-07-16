<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RecommendationRule extends Model
{
    protected $fillable = [
        'requester_role_id',
        'organization_kind',
        'request_context',
        'recommender_role_id',
        'priority',
    ];
}
