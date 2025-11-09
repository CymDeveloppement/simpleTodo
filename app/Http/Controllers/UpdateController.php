<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

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

        return response()->json([
            'success' => $exitCode === 0,
            'code' => $exitCode,
            'stdout' => $stdout,
            'stderr' => $stderr,
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


