<?php

declare(strict_types=1);

set_time_limit(0);

header('Content-Type: text/plain; charset=utf-8');
header('Cache-Control: no-cache, no-store, must-revalidate');
header('Pragma: no-cache');
header('Expires: 0');
header('X-Accel-Buffering: no');

while (ob_get_level() > 0) {
    ob_end_flush();
}
flush();

$projectRoot = dirname(__DIR__);
$scriptPath = $projectRoot . '/installSimpleTodo';

if (!is_file($scriptPath)) {
    http_response_code(500);
    echo "Script introuvable : {$scriptPath}\n";
    exit;
}

if (!is_executable($scriptPath)) {
    @chmod($scriptPath, 0755);
}

$descriptorSpec = [
    1 => ['pipe', 'w'],
    2 => ['pipe', 'w'],
];

$env = array_merge(
    [],
    array_filter($_ENV, fn($value) => is_scalar($value)),
    array_filter($_SERVER, fn($value) => is_scalar($value))
);
$env['PATH'] = getenv('PATH') ?: ($env['PATH'] ?? '');
$env['PHP_CLI'] = PHP_BINARY;

$process = proc_open(['bash', $scriptPath], $descriptorSpec, $pipes, $projectRoot, $env);

if (!is_resource($process)) {
    http_response_code(500);
    echo "Impossible de démarrer le script d'installation.\n";
    exit;
}

foreach ($pipes as $pipe) {
    stream_set_blocking($pipe, false);
}

$openPipes = $pipes;

while (!empty($openPipes)) {
    $read = $openPipes;
    $write = null;
    $except = null;

    if (stream_select($read, $write, $except, 0, 200000) === false) {
        break;
    }

    foreach ($read as $pipe) {
        $chunk = fread($pipe, 8192);

        if ($chunk === '' && feof($pipe)) {
            $key = array_search($pipe, $openPipes, true);
            if ($key !== false) {
                fclose($openPipes[$key]);
                unset($openPipes[$key]);
            }
            continue;
        }

        if ($chunk !== false && $chunk !== '') {
            echo $chunk;
            flush();
        }
    }
}

$exitCode = proc_close($process);
echo "\n---\nInstallation terminée avec le code de sortie {$exitCode}.\n";

