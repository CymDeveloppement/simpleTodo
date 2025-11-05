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

// Sinon, passer à l'API Lumen
require __DIR__.'/../vendor/autoload.php';

(new Laravel\Lumen\Bootstrap\LoadEnvironmentVariables(
    dirname(__DIR__)
))->bootstrap();

$app = require_once __DIR__.'/../bootstrap/app.php';

$app->run();
