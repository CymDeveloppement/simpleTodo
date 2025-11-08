<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;

class CheckUpdateCommand extends Command
{
    protected $signature = 'simpletodo:check-update {repo? : Dépôt GitHub owner/repo (optionnel)}';

    protected $description = 'Compare la version locale avec la dernière release GitHub';

    public function handle(): int
    {
        $repo = $this->argument('repo') ?: null;

        $checker = app(\App\Services\UpdateChecker::class);

        $localVersion = $checker->getLocalVersion();
        if ($localVersion === null) {
            $this->error('Impossible de déterminer la version locale (Script getCurrentVersion).');
            return Command::FAILURE;
        }

        $this->line("Version locale : {$localVersion}");

        $remoteVersion = $checker->getRemoteVersion($repo);
        if ($remoteVersion === null) {
            $this->error('Impossible de récupérer la version distante (Script getUpdate).');
            return Command::FAILURE;
        }

        $this->line("Dernière release distante : {$remoteVersion}");

        if (!$checker->hasNewerVersion($repo)) {
            $this->info('✅ La version locale est à jour.');
            return Command::SUCCESS;
        }

        $this->warn('⚠️ Une nouvelle version est disponible.');
        $this->line("  Locale : {$localVersion}");
        $this->line("  Distante : {$remoteVersion}");

        return Command::SUCCESS;
    }
}

