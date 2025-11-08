<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;

class UpdateChecker
{
    protected string $getCurrentScript;
    protected string $repository;
    protected string $apiBase;

    public function __construct(?string $getCurrentPath = null, ?string $repository = null)
    {
        $basePath = base_path();
        $this->getCurrentScript = $getCurrentPath ?? $basePath . '/getCurrentVersion';
        $this->repository = $repository ?? env('ADMIN_REPOSITORY', 'CymDeveloppement/simpleTodo');
        $this->apiBase = 'https://api.github.com/repos';
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
        $release = $this->getRemoteRelease($repo);
        return $release['tag_name'] ?? null;
    }

    public function getRemoteRelease(?string $repo = null): ?array
    {
        $repoName = $repo ?? $this->repository;
        if (!$repoName) {
            return null;
        }

        $release = $this->requestJson("{$this->apiBase}/{$repoName}/releases/latest");
        if (!$release || isset($release['message'])) {
            return null;
        }

        return [
            'tag_name' => $release['tag_name'] ?? null,
            'name' => $release['name'] ?? null,
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

    protected function requestJson(string $url): ?array
    {
        $context = stream_context_create([
            'http' => [
                'method' => 'GET',
                'header' => "Accept: application/vnd.github+json\r\nUser-Agent: simpletodo-update-checker\r\n",
                'timeout' => 10,
            ],
        ]);


        Log::info('Requesting JSON from URL: ' . $url);
        Log::info('Context: ' . json_encode($context));
        $result = @file_get_contents($url, false, $context);
        if ($result === false) {
            return null;
        }

        $data = json_decode($result, true);
        return is_array($data) ? $data : null;
    }
}

