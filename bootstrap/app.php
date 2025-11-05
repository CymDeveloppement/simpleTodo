<?php

require_once __DIR__.'/../vendor/autoload.php';

(new Laravel\Lumen\Bootstrap\LoadEnvironmentVariables(
    dirname(__DIR__)
))->bootstrap();

$app = new Laravel\Lumen\Application(
    dirname(__DIR__)
);

$app->withFacades();
$app->withEloquent();

// Register Blade view engine
$app->register(Illuminate\View\ViewServiceProvider::class);
$app->configure('view');

// Helper functions
if (!function_exists('resource_path')) {
    function resource_path($path = '') {
        return app()->basePath() . DIRECTORY_SEPARATOR . 'resources' . ($path ? DIRECTORY_SEPARATOR . $path : $path);
    }
}

if (!function_exists('database_path')) {
    function database_path($path = '') {
        return app()->basePath() . DIRECTORY_SEPARATOR . 'database' . ($path ? DIRECTORY_SEPARATOR . $path : $path);
    }
}

if (!function_exists('csrf_token')) {
    function csrf_token() {
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (!isset($_SESSION['csrf_token'])) {
            $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
        }
        
        return $_SESSION['csrf_token'];
    }
}

// Register config files
$app->configure('mail');
$app->configure('services');

$app->singleton(
    Illuminate\Contracts\Debug\ExceptionHandler::class,
    App\Exceptions\Handler::class
);

$app->singleton(
    Illuminate\Contracts\Console\Kernel::class,
    App\Console\Kernel::class
);

// Register MailService
$app->singleton(
    App\Services\MailService::class,
    App\Services\MailService::class
);

// Configure Mail Manager
$app->singleton('mail.manager', function ($app) {
    return new \Illuminate\Mail\MailManager($app);
});

$app->singleton('mailer', function ($app) {
    return $app->make('mail.manager')->mailer();
});

// Enable CORS
$app->middleware([
    App\Http\Middleware\CorsMiddleware::class,
]);

// Routes
$app->router->group([], function ($router) {
    require __DIR__.'/../routes/web.php';
});

return $app;
