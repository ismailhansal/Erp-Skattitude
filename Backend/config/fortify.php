<?php

use Laravel\Fortify\Features;

return [
    'guard' => 'web',
    
    'passwords' => 'users',
    
    'username' => 'email',
    
    'email' => 'email',
    
    'lowercase_usernames' => true,
    
    'home' => '/dashboard',
    
    'middleware' => ['web'],
    
    'limiters' => [
        'login' => 'login',
        'two-factor' => 'two-factor',
    ],
    
    'paths' => [
        'login' => null,
        'logout' => null,
    ],
    
    // IMPORTANT : Tous les redirects à null pour les SPAs
    'redirects' => [
        'login' => null,        // ← null au lieu d'une URL
        'logout' => null,       // ← null
        'password-confirmation' => null,
        'register' => null,
        'email-verification' => null,
        'password-reset' => null,
    ],
    
    'features' => [
        // Features désactivées pour l'instant
    ],
    
    'views' => false,  // Pas de vues, on utilise React
];