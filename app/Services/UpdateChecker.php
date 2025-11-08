<?php

namespace App\Services;

class UpdateChecker
{
    protected string $getCurrentScript;
    protected string $getUpdateScript;

    public function __construct(?string $getCurrentPath = null, ?string $getUpdatePath = null)
    {
        $basePath = base_path();
        $this->getCurrentScript = $getCurrentPath ?? $basePath . '/getCurrentVersion';
        $this->getUpdateScript = $getUpdatePath ?? $basePath . '/getUpdate';
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
        if (!is_executable($this->getUpdateScript)) {
            return null;
        }

        $command = escapeshellcmd($this->getUpdateScript);
        if ($repo) {
            $command .= ' ' . escapeshellarg($repo);
        }

        $raw = shell_exec($command);
        if ($raw === null) {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded) || isset($decoded['message'])) {
            return null;
        }

        return $decoded['tag_name'] ?? null;
    }

    public function getRemoteRelease(?string $repo = null): ?array
    {
        if (!is_executable($this->getUpdateScript)) {
            return null;
        }

        $command = escapeshellcmd($this->getUpdateScript);
        if ($repo) {
            $command .= ' ' . escapeshellarg($repo);
        }

        $raw = shell_exec($command);
        if ($raw === null) {
            return null;
        }

        $decoded = json_decode($raw, true);
        if (!is_array($decoded) || isset($decoded['message'])) {
            return null;
        }

        return [
            'tag_name' => $decoded['tag_name'] ?? null,
            'name' => $decoded['name'] ?? null,
        ];
    }

    public function getLocalVersion(): ?string
    {
        if (!is_executable($this->getCurrentScript)) {
            return null;
        }

        $output = shell_exec(escapeshellcmd($this->getCurrentScript));
        if ($output === null) {
            return null;
        }

        $trimmed = trim($output);
        return $trimmed === '' ? null : $trimmed;
    }
}

