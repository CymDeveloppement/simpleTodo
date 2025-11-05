<?php

// Récupérer l'URI de la requête
$uri = urldecode(
    parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH)
);

// Si c'est un fichier JavaScript ou CSS, servir directement
if (preg_match('/\.(?:js|css)$/', $uri)) {
    $filePath = __DIR__ . $uri;
    if (file_exists($filePath)) {
        if (strpos($uri, '.js') !== false) {
            header('Content-Type: application/javascript');
        } else if (strpos($uri, '.css') !== false) {
            header('Content-Type: text/css');
        }
        readfile($filePath);
        exit;
    }
}

// Sinon, passer à Laravel
use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

$kernel->terminate($request, $response);
