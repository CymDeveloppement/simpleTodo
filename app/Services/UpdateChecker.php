<?php

namespace App\Services;

class UpdateChecker
{
    protected string $localVersionScript;
    protected string $remoteVersionScript;
    protected ?string $defaultRemote;

    public function __construct(?string $localScript = null, ?string $remoteScript = null, ?string $remote = null)
    {
        $basePath = base_path();
        $this->localVersionScript = $localScript ?? $basePath . '/getCurrentVersion';
        $this->remoteVersionScript = $remoteScript ?? $basePath . '/getNewVersion';
        $this->defaultRemote = $remote ?? env('ADMIN_REPOSITORY', 'CymDeveloppement/simpleTodo');
    }

    public function hasNewerVersion(?string $repo = null): bool
    {
        $local = $this->getLocalVersion();
        $remote = $this->getRemoteVersion($repo);

        if ($local === null || $remote === null) {
            return false;
        }

        return trim($local) !== trim($remote);
    }

    public function getRemoteVersion(?string $repo = null): ?string
    {
        $target = $repo ?? $this->defaultRemote;
        $arguments = $target ? [$target] : [];

        return $this->runScript($this->remoteVersionScript, $arguments);
    }

    public function getLocalVersion(): ?string
    {
        return $this->runScript($this->localVersionScript);
    }

    protected function runScript(string $script, array $arguments = []): ?string
    {
        if (!is_executable($script)) {
            return null;
        }

        $command = escapeshellarg($script);
        foreach ($arguments as $argument) {
            $command .= ' ' . escapeshellarg($argument);
        }

        $output = [];
        $exitCode = 0;
        exec($command, $output, $exitCode);

        if ($exitCode !== 0) {
            return null;
        }

        $result = trim(implode("\n", $output));

        return $result === '' ? null : $result;
    }
}

