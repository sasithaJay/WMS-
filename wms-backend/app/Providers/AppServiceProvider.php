<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Laravel\Sanctum\Sanctum;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Sanctum::authenticateAccessTokensUsing(function ($accessToken, bool $isValid): bool {
            if (! $isValid) {
                return false;
            }

            $lastActivity = $accessToken->last_used_at ?? $accessToken->created_at;
            $idleTimeout = (int) config('sanctum.idle_timeout', 30);

            if ($lastActivity && $lastActivity->lte(now()->subMinutes($idleTimeout))) {
                $accessToken->delete();

                return false;
            }

            return true;
        });
    }
}
