<?php

namespace App\Console\Commands;

use App\Services\MailService;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class TestMailCommand
{
    protected $mailService;

    public function __construct(MailService $mailService)
    {
        $this->mailService = $mailService;
    }

    public function handle($args)
    {
        $email = $args[0] ?? null;

        if (!$email) {
            echo "❌ Veuillez spécifier une adresse email.\n";
            echo "Usage: php artisan mail:test mon@email.com\n";
            return 1;
        }

        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            echo "❌ Adresse email invalide.\n";
            return 1;
        }

        echo "📧 Envoi d'un email de test à : $email\n";
        echo "📋 Configuration actuelle : " . env('MAIL_MAILER', 'smtp') . "\n\n";

        try {
            // Test simple avec Mail::raw
            Mail::raw(
                "Ceci est un email de test depuis SimpleTodo.\n\n" .
                "Si vous recevez cet email, cela signifie que votre configuration d'envoi d'emails fonctionne correctement.\n\n" .
                "Date : " . date('d/m/Y H:i') . "\n" .
                "Mode : " . env('MAIL_MAILER', 'smtp') . "\n\n" .
                "SimpleTodo - Application de Todolist Collaborative",
                function ($message) use ($email) {
                    $message->to($email)
                        ->subject('Test SimpleTodo - Configuration email');
                }
            );

            $mailer = env('MAIL_MAILER', 'smtp');
            
            if ($mailer === 'log') {
                echo "✅ Email écrit dans les logs (mode log activé)\n";
                echo "📍 Vérifiez le fichier : storage/logs/laravel.log\n";
            } else {
                echo "✅ Email envoyé avec succès !\n";
                echo "📬 Vérifiez votre boîte de réception.\n";
            }

        } catch (\Exception $e) {
            echo "❌ Erreur lors de l'envoi : " . $e->getMessage() . "\n";
            echo "📍 Détails dans storage/logs/laravel.log\n";
            return 1;
        }

        return 0;
    }
}

