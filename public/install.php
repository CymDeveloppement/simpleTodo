<?php

declare(strict_types=1);

$projectRoot = dirname(__DIR__);
$envPath = $projectRoot . '/.env';
$envExamplePath = $projectRoot . '/env.example';
$scriptPath = $projectRoot . '/update-bin/installSimpleTodo';

if (isset($_GET['stream'])) {
    runInstallScript($projectRoot, $scriptPath);
    exit;
}

$fields = [
    'APP_URL' => 'http://localhost',
    'TODO_SERVICE_NAME' => 'SimpleTodo',
    'ADMIN_EMAIL' => '',
    'ADMIN_REPOSITORY' => 'CymDeveloppement/simpleTodo',
    'MAIL_MAILER' => 'smtp',
    'MAIL_HOST' => 'smtp.mailgun.org',
    'MAIL_PORT' => '587',
    'MAIL_USERNAME' => '',
    'MAIL_PASSWORD' => '',
    'MAIL_ENCRYPTION' => 'tls',
    'MAIL_FROM_ADDRESS' => 'noreply@simpletodo.local',
    'MAIL_FROM_NAME' => 'SimpleTodo',
];

$messages = [];
$errors = [];
$envValues = loadEnvValues($envPath, $fields);
if (empty($envValues) && is_file($envExamplePath)) {
    $envValues = array_merge($fields, loadEnvValues($envExamplePath, $fields));
} else {
    $envValues = array_merge($fields, $envValues);
}

$envReady = is_file($envPath);
$step = $envReady ? 2 : 1;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $submitted = [];
    foreach ($fields as $key => $default) {
        $submitted[$key] = sanitizeInput($_POST[$key] ?? '');
    }

    $missing = array_filter(['ADMIN_EMAIL', 'MAIL_FROM_ADDRESS'], fn($key) => $submitted[$key] === '');
    if (!empty($missing)) {
        $errors[] = 'Veuillez renseigner les champs requis : ' . implode(', ', $missing) . '.';
    }

    if (empty($errors)) {
        if (!is_file($envPath) && is_file($envExamplePath)) {
            copy($envExamplePath, $envPath);
        } elseif (!is_file($envPath)) {
            file_put_contents($envPath, '');
        }

        if (!writeEnvFile($envPath, $submitted, $envExamplePath)) {
            $errors[] = "Impossible d'écrire le fichier .env.";
        } else {
            $messages[] = 'Configuration enregistrée dans .env.';
            $envValues = array_merge($envValues, $submitted);
            $envReady = true;
            $step = 2;
        }
    } else {
        $envValues = array_merge($envValues, $submitted);
    }
}

echo renderHtmlPage($envValues, $messages, $errors, $envReady, $step);

function sanitizeInput(string $value): string
{
    return trim(str_replace(["\r", "\n"], '', $value));
}

function loadEnvValues(string $path, array $fields): array
{
    if (!is_file($path)) {
        return [];
    }

    $values = [];
    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    foreach ($lines as $line) {
        $line = trim($line);
        if ($line === '' || str_starts_with($line, '#')) {
            continue;
        }

        $parts = explode('=', $line, 2);
        if (count($parts) !== 2) {
            continue;
        }

        $key = trim($parts[0]);
        if (!array_key_exists($key, $fields)) {
            continue;
        }

        $value = trim($parts[1]);
        if (str_starts_with($value, '"') && str_ends_with($value, '"')) {
            $value = stripcslashes(substr($value, 1, -1));
        } elseif (str_starts_with($value, "'") && str_ends_with($value, "'")) {
            $value = substr($value, 1, -1);
        }

        $values[$key] = $value;
    }

    return $values;
}

function writeEnvFile(string $envPath, array $values, string $templatePath): bool
{
    $targetLines = is_file($envPath) ? file($envPath) : [];
    if (empty($targetLines) && is_file($templatePath)) {
        $targetLines = file($templatePath);
    }

    $keysWritten = [];
    foreach ($targetLines as $index => $line) {
        $line = rtrim($line, "\r\n");
        if ($line === '' || str_starts_with(trim($line), '#') || !str_contains($line, '=')) {
            $targetLines[$index] = $line;
            continue;
        }

        [$key] = explode('=', $line, 2);
        $key = trim($key);
        if (!array_key_exists($key, $values)) {
            $targetLines[$index] = $line;
            continue;
        }

        $targetLines[$index] = $key . '=' . formatEnvValue($values[$key]);
        $keysWritten[$key] = true;
    }

    foreach ($values as $key => $value) {
        if (isset($keysWritten[$key])) {
            continue;
        }
        $targetLines[] = $key . '=' . formatEnvValue($value);
    }

    $content = implode(PHP_EOL, $targetLines);
    if (!str_ends_with($content, PHP_EOL)) {
        $content .= PHP_EOL;
    }

    return file_put_contents($envPath, $content) !== false;
}

function formatEnvValue(string $value): string
{
    if ($value === '') {
        return '';
    }

    if (preg_match('/\s|#|\'|"|=/', $value)) {
        return '"' . addcslashes($value, "\"\\") . '"';
    }

    return $value;
}

function renderHtmlPage(array $values, array $messages, array $errors, bool $envReady, int $step): string
{
    $html = [];
    $html[] = '<!DOCTYPE html>';
    $html[] = '<html lang="fr">';
    $html[] = '<head>';
    $html[] = '    <meta charset="utf-8">';
    $html[] = '    <meta name="viewport" content="width=device-width, initial-scale=1">';
    $html[] = '    <title>Installation SimpleTodo</title>';
    $html[] = '    <style>';
    $html[] = '        body { font-family: system-ui, sans-serif; margin: 0; background: #f5f5f5; color: #1f2933; }';
    $html[] = '        header { background: #1f2937; color: #fff; padding: 24px; text-align: center; }';
    $html[] = '        main { max-width: 960px; margin: 24px auto; padding: 24px; background: #fff; border-radius: 12px; box-shadow: 0 10px 30px rgba(15,23,42,0.08); }';
    $html[] = '        h1 { margin: 0 0 8px; font-size: 28px; }';
    $html[] = '        h2 { margin-top: 32px; font-size: 22px; color: #111827; }';
    $html[]    = '        .step-badge { display: inline-flex; align-items: center; justify-content: center; width: 28px; height: 28px; border-radius: 50%; background: #4f46e5; color: #fff; font-weight: bold; margin-right: 12px; }';
    $html[] = '        form { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 16px 24px; }';
    $html[] = '        label { display: block; font-weight: 600; margin-bottom: 6px; color: #111827; }';
    $html[] = '        input, select { width: 100%; padding: 10px 12px; border-radius: 8px; border: 1px solid #d1d5db; background: #f9fafb; transition: border 0.2s ease; font-size: 15px; }';
    $html[] = '        input:focus, select:focus { outline: none; border-color: #4f46e5; background: #fff; }';
    $html[] = '        .actions { grid-column: 1 / -1; margin-top: 12px; display: flex; gap: 12px; }';
    $html[] = '        button { padding: 12px 20px; border-radius: 8px; border: none; cursor: pointer; font-weight: 600; font-size: 15px; }';
    $html[] = '        .primary { background: #4f46e5; color: #fff; }';
    $html[] = '        .primary:disabled { background: #a5b4fc; cursor: not-allowed; }';
    $html[] = '        .secondary { background: #e5e7eb; color: #111827; }';
    $html[] = '        .messages { margin: 16px 0 0; }';
    $html[] = '        .messages > div { padding: 10px 14px; border-radius: 8px; margin-bottom: 10px; }';
    $html[] = '        .success { background: #ecfdf3; color: #166534; border: 1px solid #bbf7d0; }';
    $html[] = '        .error { background: #fef2f2; color: #b91c1c; border: 1px solid #fecaca; }';
    $html[] = '        #output { background: #0f172a; color: #e2e8f0; padding: 16px; border-radius: 10px; height: 320px; overflow-y: auto; font-family: "Fira Mono", "SFMono-Regular", monospace; font-size: 13px; white-space: pre-wrap; }';
    $html[] = '        .status { margin-top: 12px; font-size: 14px; color: #6b7280; display: flex; align-items: center; gap: 8px; }';
    $html[] = '        .status.active::before { content: ""; width: 10px; height: 10px; border-radius: 50%; background: #22c55e; display: inline-block; animation: pulse 1.2s infinite ease-in-out; }';
    $html[] = '        @keyframes pulse { 0%, 100% { opacity: 0.4; } 50% { opacity: 1; } }';
    $html[] = '        footer { text-align: center; padding: 16px; color: #6b7280; font-size: 14px; }';
    $html[] = '    </style>';
    $html[] = '</head>';
    $html[] = '<body>';
    $html[] = '    <header>';
    $html[] = '        <h1>Assistant d&rsquo;installation SimpleTodo</h1>';
    $html[] = '        <p>Configurez votre instance et lancez l&rsquo;installation en deux étapes.</p>';
    $html[] = '    </header>';
    $html[] = '    <main>';

    $html[] = renderStepOne($values, $messages, $errors);
    $html[] = renderStepTwo($envReady, $step >= 2);

    $html[] = '    </main>';
    $html[] = '    <footer>SimpleTodo Installer &copy; ' . date('Y') . '</footer>';
    $html[] = renderClientScript($envReady);
    $html[] = '</body>';
    $html[] = '</html>';

    return implode(PHP_EOL, $html);
}

function renderStepOne(array $values, array $messages, array $errors): string
{
    $fieldsMeta = [
        'APP_URL' => ['label' => 'URL de l’application', 'type' => 'url', 'required' => false],
        'TODO_SERVICE_NAME' => ['label' => 'Nom du service', 'type' => 'text', 'required' => false],
        'ADMIN_EMAIL' => ['label' => 'Email administrateur', 'type' => 'email', 'required' => true],
        'ADMIN_REPOSITORY' => ['label' => 'Dépôt GitHub', 'type' => 'text', 'required' => false],
        'MAIL_MAILER' => ['label' => 'Mailer', 'type' => 'text', 'required' => false],
        'MAIL_HOST' => ['label' => 'Hôte SMTP', 'type' => 'text', 'required' => false],
        'MAIL_PORT' => ['label' => 'Port SMTP', 'type' => 'number', 'required' => false],
        'MAIL_USERNAME' => ['label' => 'Utilisateur SMTP', 'type' => 'text', 'required' => false],
        'MAIL_PASSWORD' => ['label' => 'Mot de passe SMTP', 'type' => 'password', 'required' => false],
        'MAIL_ENCRYPTION' => ['label' => 'Chiffrement', 'type' => 'text', 'required' => false],
        'MAIL_FROM_ADDRESS' => ['label' => 'Adresse expéditeur', 'type' => 'email', 'required' => true],
        'MAIL_FROM_NAME' => ['label' => 'Nom expéditeur', 'type' => 'text', 'required' => false],
    ];

    $html = [];
    $html[] = '        <section>';
    $html[] = '            <h2><span class="step-badge">1</span>Configuration de l&rsquo;environnement</h2>';
    $html[] = '            <p>Renseignez les informations nécessaires pour générer le fichier <code>.env</code>.</p>';

    if (!empty($messages) || !empty($errors)) {
        $html[] = '            <div class="messages">';
        foreach ($messages as $message) {
            $html[] = '                <div class="success">' . htmlspecialchars($message, ENT_QUOTES, 'UTF-8') . '</div>';
        }
        foreach ($errors as $error) {
            $html[] = '                <div class="error">' . htmlspecialchars($error, ENT_QUOTES, 'UTF-8') . '</div>';
        }
        $html[] = '            </div>';
    }

    $html[] = '            <form method="post" autocomplete="off">';
    foreach ($fieldsMeta as $key => $meta) {
        $value = htmlspecialchars($values[$key] ?? '', ENT_QUOTES, 'UTF-8');
        $requiredAttr = $meta['required'] ? 'required' : '';
        $typeAttr = $meta['type'];

        $html[] = '                <div>';
        $html[] = '                    <label for="' . $key . '">' . htmlspecialchars($meta['label'], ENT_QUOTES, 'UTF-8');
        if ($meta['required']) {
            $html[] = '                        <span style="color:#b91c1c;"> *</span>';
        }
        $html[] = '                    </label>';
        $html[] = '                    <input type="' . $typeAttr . '" id="' . $key . '" name="' . $key . '" value="' . $value . '" ' . $requiredAttr . '>';
        $html[] = '                </div>';
    }

    $html[] = '                <div class="actions">';
    $html[] = '                    <button type="submit" class="primary">Enregistrer la configuration</button>';
    $html[] = '                    <button type="reset" class="secondary">Réinitialiser</button>';
    $html[] = '                </div>';
    $html[] = '            </form>';
    $html[] = '        </section>';

    return implode(PHP_EOL, $html);
}

function renderStepTwo(bool $envReady, bool $unlocked): string
{
    $html = [];
    $html[] = '        <section>';
    $html[] = '            <h2><span class="step-badge">2</span>Lancement de l&rsquo;installation</h2>';
    $html[] = '            <p>Une fois la configuration enregistrée, lancez le script d&rsquo;installation automatique. La sortie s&rsquo;affichera en direct ci-dessous.</p>';
    $html[] = '            <div class="actions">';
    $disabledAttr = $unlocked ? '' : 'disabled';
    $html[] = '                <button type="button" class="primary" id="runInstall" ' . $disabledAttr . '>Démarrer l&rsquo;installation</button>';
    $html[] = '                <button type="button" class="secondary" id="clearOutput">Effacer la sortie</button>';
    $html[] = '            </div>';
    $html[] = '            <div class="status" id="installStatus">' . ($unlocked ? 'En attente de lancement' : 'Veuillez d&rsquo;abord enregistrer la configuration (.env)') . '</div>';
    $html[] = '            <pre id="output" aria-live="polite"></pre>';
    $html[] = '        </section>';

    return implode(PHP_EOL, $html);
}

function renderClientScript(bool $envReady): string
{
    $envReadyJs = $envReady ? 'true' : 'false';
    return <<<HTML
<script>
(function () {
    const runButton = document.getElementById('runInstall');
    const clearButton = document.getElementById('clearOutput');
    const output = document.getElementById('output');
    const status = document.getElementById('installStatus');
    let controller = null;

    function appendLine(text) {
        output.textContent += text;
        output.scrollTop = output.scrollHeight;
    }

    function setStatus(message, isActive) {
        status.textContent = message;
        status.classList.toggle('active', !!isActive);
    }

    if (!runButton) {
        return;
    }

    runButton.addEventListener('click', async () => {
        if (controller) {
            controller.abort();
        }

        output.textContent = '';
        controller = new AbortController();
        runButton.disabled = true;
        setStatus('Installation en cours...', true);

        try {
            const response = await fetch('?stream=1', {
                method: 'GET',
                signal: controller.signal,
            });

            if (!response.ok || !response.body) {
                throw new Error('Impossible de démarrer le script (' + response.status + ')');
            }

            const reader = response.body.getReader();
            const decoder = new TextDecoder();

            while (true) {
                const {value, done} = await reader.read();
                if (done) {
                    break;
                }
                appendLine(decoder.decode(value));
            }

            setStatus('Installation terminée.', false);
        } catch (error) {
            appendLine('\\n[Erreur] ' + (error?.message || error));
            setStatus('Erreur lors de l\\'installation.', false);
        } finally {
            runButton.disabled = false;
            controller = null;
        }
    });

    clearButton.addEventListener('click', () => {
        output.textContent = '';
        setStatus('En attente de lancement', false);
    });
})();
</script>
HTML;
}

function runInstallScript(string $projectRoot, string $scriptPath): void
{
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

    if (!is_file($scriptPath)) {
        http_response_code(500);
        echo "Script introuvable : {$scriptPath}\n";
        return;
    }

    if (!is_executable($scriptPath)) {
        @chmod($scriptPath, 0755);
    }

    $descriptorSpec = [
        1 => ['pipe', 'w'],
        2 => ['pipe', 'w'],
    ];


    $env = array_filter($_ENV, fn($value) => is_scalar($value));
    $serverEnv = array_filter($_SERVER, fn($value) => is_scalar($value));
    $env = array_merge($serverEnv, $env);

    $env['PATH'] = getenv('PATH') ?: ($env['PATH'] ?? '');

    $phpCli = PHP_BINARY;
    if (!is_file($phpCli) || !is_executable($phpCli) || str_contains(strtolower($phpCli), 'php-fpm')) {
        $bindirCli = PHP_BINDIR . DIRECTORY_SEPARATOR . 'php';
        if (is_file($bindirCli) && is_executable($bindirCli)) {
            $phpCli = $bindirCli;
        }
    }
    $env['PHP_CLI'] = $phpCli;

    $defaultHome = $projectRoot . '/.installer-home';
    if (!is_dir($defaultHome)) {
        mkdir($defaultHome, 0775, true);
    }

    $defaultComposerHome = $projectRoot . '/.composer-installer';
    if (!is_dir($defaultComposerHome)) {
        mkdir($defaultComposerHome, 0775, true);
    }

    $env['HOME'] = $env['HOME'] ?? $defaultHome;
    $env['COMPOSER_HOME'] = $env['COMPOSER_HOME'] ?? $defaultComposerHome;

    $process = proc_open(['bash', $scriptPath], $descriptorSpec, $pipes, $projectRoot, $env);

    $logDir = $projectRoot . '/storage/logs/update';
    if (!is_dir($logDir)) {
        @mkdir($logDir, 0775, true);
    }
    $timestamp = date('Ymd_His');
    $logFile = $logDir . '/install-' . $timestamp . '.log';
    $logHandle = @fopen($logFile, 'ab');
    if ($logHandle) {
        fwrite($logHandle, "=== SimpleTodo Install ===\nDate: " . date('c') . "\nScript: {$scriptPath}\n--- OUTPUT ---\n");
    }

    if (!is_resource($process)) {
        if ($logHandle) {
            fwrite($logHandle, "Impossible de démarrer le script.\n");
            fclose($logHandle);
        }
        http_response_code(500);
        echo "Impossible de démarrer le script d'installation.\n";
        return;
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
                if ($logHandle) {
                    fwrite($logHandle, $chunk);
                }
                flush();
            }
        }
    }

    $exitCode = proc_close($process);
    $summary = "\n---\nInstallation terminée avec le code de sortie {$exitCode}.\n";
    echo $summary;
    if ($logHandle) {
        fwrite($logHandle, $summary);
        fclose($logHandle);
        echo "Journal enregistré dans : {$logFile}\n";
    }
}
