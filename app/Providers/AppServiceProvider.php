<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\MailService;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Enregistrer MailService
        $this->app->singleton(MailService::class, function ($app) {
            return new MailService($app);
        });
    }

    public function boot(): void
    {
        //
    }
}

