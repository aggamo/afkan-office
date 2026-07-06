<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // The SPA authenticates statelessly via `Authorization: Bearer` personal
        // access tokens (read from JS and sent explicitly), not Sanctum's
        // cookie/session SPA mode. Enabling EnsureFrontendRequestsAreStateful
        // here would force CSRF/session on requests coming from the frontend
        // origin (localhost:3000 is a default stateful domain) and break token
        // login with 419 CSRF errors, so it is intentionally omitted.
        $middleware->alias([
            'role' => \App\Http\Middleware\EnsureUserHasRole::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
