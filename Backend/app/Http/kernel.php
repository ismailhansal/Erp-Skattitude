<?php

namespace App\Http;

use Illuminate\Foundation\Http\Kernel as HttpKernel;
use Fruitcake\Cors\HandleCors;

class Kernel extends HttpKernel
{
    // Middleware global
    protected $middleware = [
        // ici tes middlewares globaux
    ];

    // Groupes de middleware
    protected $middlewareGroups = [
        'web' => [
            // middlewares web
        ],

        'api' => [
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class, // ← IMPORTANT : en PREMIER
            HandleCors::class, // middleware CORS
            \Laravel\Sanctum\Http\Middleware\EnsureFrontendRequestsAreStateful::class,
            \Illuminate\Routing\Middleware\ThrottleRequests::class.':api',


            'throttle:api',
            \Illuminate\Routing\Middleware\SubstituteBindings::class,
        ],
    ];

    // Middleware pour les routes individuelles
    protected $routeMiddleware = [
        // middleware personnalisés ici
    ];
}
