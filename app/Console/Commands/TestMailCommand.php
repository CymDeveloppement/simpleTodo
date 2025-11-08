<?php

namespace App\Console\Commands;

use App\Services\MailService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestMailCommand extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'mail:test {email : L\'adresse email de destination}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Envoyer un email de test pour vérifier la configuration d\'envoi d\'emails';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $email = $this->argument('email');

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            $this->error('Adresse email invalide : ' . $email);
            return Command::FAILURE;
        }

        $this->info('📧 Envoi d\'un email de test à : ' . $email);
        $this->info('📋 Configuration actuelle : ' . config('mail.default'));
        $this->newLine();

        try {
            $emailBody = "Ceci est un email de test depuis SimpleTodo.\n\n" .
                "Si vous recevez cet email, cela signifie que votre configuration d'envoi d'emails fonctionne correctement.\n\n" .
                "Date : " . date('d/m/Y H:i') . "\n" .
                "Mode : " . config('mail.default') . "\n" .
                "Host : " . config('mail.mailers.smtp.host', 'N/A') . "\n" .
                "Port : " . config('mail.mailers.smtp.port', 'N/A') . "\n\n" .
                "SimpleTodo - Application de Todolist Collaborative";
            
            $emailSubject = 'Test SimpleTodo - Configuration email';
            
            Mail::raw($emailBody, function ($message) use ($email, $emailSubject) {
                $message->to($email)->subject($emailSubject);
            });

            // Logger en mode debug
            if (config('app.debug')) {
                Log::info('Email de test envoyé', [
                    'to' => $email,
                    'subject' => $emailSubject,
                    'body' => $emailBody
                ]);
            }

            $mailer = config('mail.default');
            
            if ($mailer === 'log') {
                $this->info('✅ Email écrit dans les logs (mode log activé)');
                $this->info('📍 Vérifiez le fichier : storage/logs/laravel.log');
            } else {
                $this->info('✅ Email envoyé avec succès !');
                $this->info('📬 Vérifiez votre boîte de réception.');
            }

            return Command::SUCCESS;

        } catch (\Exception $e) {
            $this->error('❌ Erreur lors de l\'envoi : ' . $e->getMessage());
            $this->error('📍 Détails dans storage/logs/laravel.log');
            Log::error('Erreur envoi email de test : ' . $e->getMessage(), [
                'email' => $email,
                'exception' => $e
            ]);
            return Command::FAILURE;
        }
    }
}
