<?php

namespace App\Services;

use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class MailService
{
    /**
     * Envoyer une notification de nouvelle tâche
     */
    public function sendNewTodoNotification($subscribers, $todo, $listTitle)
    {
        $serviceName = env('TODO_SERVICE_NAME', 'SimpleTodo');
        foreach ($subscribers as $subscriber) {
            try {
                $listUrl = $this->getListUrl($todo->list_id, $subscriber->token);
                $emailBody = "Une nouvelle tâche a été ajoutée à la liste '{$listTitle}' :\n\n" .
                    "Tâche : {$todo->text}\n" .
                    "Créée par : {$todo->pseudo}\n" .
                    "Date : " . date('d/m/Y H:i') . "\n\n" .
                    "Vous pouvez consulter la liste à l'adresse suivante :\n" .
                    $listUrl;
                $emailSubject = "[{$serviceName}] Nouvelle tâche - {$listTitle}";
                
                Mail::raw($emailBody, function ($message) use ($subscriber, $emailSubject) {
                    $message->to($subscriber->email)->subject($emailSubject);
                });
                
                // Logger en mode debug
                if (config('app.debug')) {
                    Log::info('Email envoyé - Nouvelle tâche', [
                        'to' => $subscriber->email,
                        'subject' => $emailSubject,
                        'body' => $emailBody
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Erreur envoi email nouvelle tâche : ' . $e->getMessage());
            }
        }
    }
    
    /**
     * Envoyer une notification de tâche terminée
     */
    public function sendCompletedTodoNotification($subscribers, $todo, $listTitle)
    {
        $serviceName = env('TODO_SERVICE_NAME', 'SimpleTodo');
        foreach ($subscribers as $subscriber) {
            try {
                $listUrl = $this->getListUrl($todo->list_id, $subscriber->token);
                $emailBody = "Une tâche a été terminée dans la liste '{$listTitle}' :\n\n" .
                    "Tâche : {$todo->text}\n" .
                    "Créée par : {$todo->pseudo}\n" .
                    "Date de création : " . date('d/m/Y H:i', strtotime($todo->created_at)) . "\n" .
                    "Date de complétion : " . date('d/m/Y H:i') . "\n\n" .
                    "Vous pouvez consulter la liste à l'adresse suivante :\n" .
                    $listUrl;
                $emailSubject = "[{$serviceName}] Tâche terminée - {$listTitle}";
                
                Mail::raw($emailBody, function ($message) use ($subscriber, $emailSubject) {
                    $message->to($subscriber->email)->subject($emailSubject);
                });
                
                // Logger en mode debug
                if (config('app.debug')) {
                    Log::info('Email envoyé - Tâche terminée', [
                        'to' => $subscriber->email,
                        'subject' => $emailSubject,
                        'body' => $emailBody
                    ]);
                }
            } catch (\Exception $e) {
                Log::error('Erreur envoi email tâche terminée : ' . $e->getMessage());
            }
        }
    }
    
    /**
     * Envoyer un email de bienvenue à un nouveau souscripteur
     */
    public function sendWelcomeEmail($subscriber, $listTitle, $listUrl)
    {
        try {
            $serviceName = env('TODO_SERVICE_NAME', 'SimpleTodo');
            $emailBody = "Bienvenue dans la liste '{$listTitle}' !\n\n" .
                "Vous êtes maintenant inscrit pour recevoir des notifications par email.\n\n" .
                "Vous serez informé de :\n" .
                "• Les nouvelles tâches ajoutées\n" .
                "• Les tâches terminées\n\n" .
                "Cliquez sur le lien ci-dessous pour accéder à la liste :\n\n" .
                $listUrl . "\n\n" .
                "Pour vous désinscrire, utilisez le bouton dans les paramètres de la liste.\n\n" .
                "Bon travail !";
            $emailSubject = "[{$serviceName}] Bienvenue dans {$listTitle}";
            
            Mail::raw($emailBody, function ($message) use ($subscriber, $emailSubject) {
                $message->to($subscriber->email)->subject($emailSubject);
            });
            
            // Logger en mode debug
            if (config('app.debug')) {
                Log::info('Email envoyé - Bienvenue', [
                    'to' => $subscriber->email,
                    'subject' => $emailSubject,
                    'body' => $emailBody
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi email de bienvenue : ' . $e->getMessage());
        }
    }
    
    /**
     * Envoyer une invitation par email pour collaborer sur une liste
     */
    public function sendInvitation($email, $invitedBy, $listTitle, $listUrl)
    {
        try {
            $serviceName = env('TODO_SERVICE_NAME', 'SimpleTodo');
            $emailBody = "Invitation à collaborer sur une liste de tâches\n\n" .
                "{$invitedBy} vous invite à collaborer sur la liste '{$listTitle}' !\n\n" .
                "SimpleTodo est une application de gestion de tâches collaborative qui vous permet de :\n" .
                "• Créer et organiser des tâches\n" .
                "• Attribuer des tâches\n" .
                "• Ajouter des commentaires\n" .
                "• Organiser par catégories\n\n" .
                "Cliquez sur le lien ci-dessous pour accéder à la liste :\n\n" .
                $listUrl . "\n\n" .
                "Vous pouvez commencer à travailler immédiatement !\n\n" .
                "À bientôt sur {$serviceName} !";
            $emailSubject = "[{$serviceName}] Invitation à collaborer sur {$listTitle}";
            
            Mail::raw($emailBody, function ($message) use ($email, $emailSubject) {
                $message->to($email)->subject($emailSubject);
            });
            
            // Logger en mode debug
            if (config('app.debug')) {
                Log::info('Email envoyé - Invitation', [
                    'to' => $email,
                    'subject' => $emailSubject,
                    'body' => $emailBody
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi email d\'invitation : ' . $e->getMessage());
        }
    }
    
    /**
     * Obtenir l'URL de la liste avec token optionnel
     */
    /**
     * Envoyer un email brut (pour la file d'emails)
     */
    public function sendRawEmail($to, $subject, $body)
    {
        try {
            Mail::raw($body, function ($message) use ($to, $subject) {
                $message->to($to)->subject($subject);
            });
            
            // Logger en mode debug
            if (config('app.debug')) {
                Log::info('Email envoyé - Raw', [
                    'to' => $to,
                    'subject' => $subject,
                    'body' => $body
                ]);
            }
        } catch (\Exception $e) {
            throw $e;
        }
    }

    private function getListUrl($listId, $token = null)
    {
        $url = request()->getSchemeAndHttpHost() . '/' . $listId;
        if ($token) {
            $url .= '/' . $token;
        }
        return $url;
    }
}

