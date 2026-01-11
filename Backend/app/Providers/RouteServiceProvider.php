<?php

namespace App\Providers;

use Illuminate\Support\Facades\Route;
use Illuminate\Foundation\Support\Providers\RouteServiceProvider as ServiceProvider;

class RouteServiceProvider extends ServiceProvider
{
    /**
     * The path to the "home" route for your application.
     */
    public const HOME = '/home';

    /**
     * Define your route model bindings, pattern filters, etc.
     */
    public function boot(): void
    {
        $this->routes(function () {
            // Routes API
            Route::prefix('api')
                ->middleware('api')
                ->group(base_path('routes/api.php'));

            // Routes Web
            Route::middleware('web')
                ->group(base_path('routes/web.php'));
        });
    }
}
