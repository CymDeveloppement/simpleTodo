<?php

namespace App\Console;

use App\Console\Commands\CheckUpdateCommand;
use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    protected $commands = [
        CheckUpdateCommand::class,
    ];

    protected function schedule(Schedule $schedule)
    {
        //
    }
}
