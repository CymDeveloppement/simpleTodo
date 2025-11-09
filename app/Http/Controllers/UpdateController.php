<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class UpdateController extends Controller
{
    public function run(Request $request)
    {
        // Authz: réservé à l'administrateur (ADMIN_EMAIL)
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        $adminEmail = strtolower(trim((string) env('ADMIN_EMAIL')));
        $sessionEmail = isset($_SESSION['simpleTodo_email']) ? strtolower(trim((string) $_SESSION['simpleTodo_email'])) : null;
        // Fallback: autoriser via paramètre/entête si la session n'est pas positionnée
        $requestEmail = strtolower(trim((string) ($request->input('email') ?? $request->header('X-User-Email') ?? '')));

        $isAuthorized = !empty($adminEmail) && (
            ($sessionEmail && $sessionEmail === $adminEmail) ||
            ($requestEmail && $requestEmail === $adminEmail)
        );

        if (!$isAuthorized) {
            return response()->json([
                'success' => false,
                'message' => 'Accès refusé',
            ], 403);
        }

        // Déterminer le chemin du script update.sh à la racine de l'app Lumen (dossier /todo)
        // Utiliser la base du projet plutôt que le dossier app/
        $projectRoot = app()->basePath(); // ex: /home/.../todo
        $scriptPath = $projectRoot . '/update-bin/update.sh';

        if (!file_exists($scriptPath)) {
            return response()->json([
                'success' => false,
                'message' => 'Script update.sh introuvable',
                'path' => $scriptPath,
            ], 404);
        }

        // S'assurer que le script est exécutable
        @chmod($scriptPath, 0755);

        // Exécuter le script dans son répertoire courant
        $descriptorSpec = [
            1 => ['pipe', 'w'], // stdout
            2 => ['pipe', 'w'], // stderr
        ];

        $cmd = 'bash update-bin/update.sh';
        if ($request->boolean('force')) {
            $cmd .= ' --force';
        }
        $process = proc_open($cmd, $descriptorSpec, $pipes, $projectRoot);

        if (!\is_resource($process)) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de démarrer le script',
            ], 500);
        }

        $stdout = stream_get_contents($pipes[1]);
        $stderr = stream_get_contents($pipes[2]);
        fclose($pipes[1]);
        fclose($pipes[2]);

        $exitCode = proc_close($process);

        $checker = app(\App\Services\UpdateChecker::class);
        $localVersion = $checker->getLocalVersion() ?? 'unknown';
        $sanitizedVersion = preg_replace('/[^A-Za-z0-9._-]/', '_', $localVersion);
        $timestamp = date('Ymd_His');
        $logDir = storage_path('logs/update');
        if (!is_dir($logDir)) {
            @mkdir($logDir, 0775, true);
        }
        $logFile = $logDir . '/' . ($sanitizedVersion ?: 'unknown') . '-' . $timestamp . '.log';

        $context = [
            'script' => $scriptPath,
            'force' => $request->boolean('force'),
            'admin_email' => $adminEmail,
            'session_email' => $sessionEmail,
            'request_email' => $requestEmail,
            'exit_code' => $exitCode,
            'stdout' => trim($stdout),
            'stderr' => trim($stderr),
            'version' => $localVersion,
            'log_file' => $logFile,
        ];

        $logHeader = "=== SimpleTodo Update ===\n"
            . 'Date: ' . date('c') . "\n"
            . "Version: {$localVersion}\n"
            . "Script: {$scriptPath}\n"
            . 'Force: ' . ($request->boolean('force') ? 'true' : 'false') . "\n"
            . "Admin email: {$adminEmail}\n"
            . "Session email: {$sessionEmail}\n"
            . "Request email: {$requestEmail}\n"
            . "Exit code: {$exitCode}\n"
            . "--- STDOUT ---\n"
            . ($stdout ?? '') . "\n"
            . "--- STDERR ---\n"
            . ($stderr ?? '') . "\n";

        if (is_dir($logDir)) {
            @file_put_contents($logFile, $logHeader, LOCK_EX);
        }

        if ($exitCode === 0) {
            Log::channel('update')->info('Exécution réussie de update.sh', $context);
        } else {
            Log::channel('update')->error('Échec de l\'exécution de update.sh', $context);
        }

        return response()->json([
            'success' => $exitCode === 0,
            'code' => $exitCode,
            'stdout' => $stdout,
            'stderr' => $stderr,
            'log_file' => is_dir($logDir) ? $logFile : null,
        ], $exitCode === 0 ? 200 : 500);
    }

    public function check(Request $request)
    {
        /** @var \App\Services\UpdateChecker $checker */
        $checker = app(\App\Services\UpdateChecker::class);

        $local = $checker->getLocalVersion();
        $remoteTag = $checker->getRemoteVersion();

        if ($remoteTag === null) {
            return response()->json([
                'success' => false,
                'message' => 'Impossible de récupérer le tag distant',
                'remote_tag' => null,
            ], 500);
        }

        return response()->json([
            'success' => true,
            'local_version' => $local,
            'remote_tag' => $remoteTag,
            'remote_name' => null,
            'has_update' => $local ? $local !== $remoteTag : true,
        ]);
    }
}


