<?php

namespace App\Http\Controllers;

use App\Models\EmailQueue;
use App\Services\MailService;
use Illuminate\Http\Request;

class EmailQueueController extends Controller
{
    protected $mailService;

    public function __construct(MailService $mailService)
    {
        $this->mailService = $mailService;
    }

    /**
     * Envoie les emails en attente dans la file
     */
    public function process(Request $request)
    {
        // Récupérer les emails en attente (limite à 10 à la fois)
        $emails = EmailQueue::where('status', 'pending')
            ->orderBy('created_at', 'asc')
            ->limit(10)
            ->get();

        $sent = 0;
        $failed = 0;

        foreach ($emails as $emailQueue) {
            try {
                // Envoyer l'email via MailService
                $this->mailService->sendRawEmail(
                    $emailQueue->recipient_email,
                    $emailQueue->subject,
                    $emailQueue->body
                );

                // Marquer comme envoyé
                $emailQueue->status = 'sent';
                $emailQueue->sent_at = date('Y-m-d H:i:s');
                $emailQueue->save();

                $sent++;
            } catch (\Exception $e) {
                // Marquer comme échec
                $emailQueue->status = 'failed';
                $emailQueue->error_message = $e->getMessage();
                $emailQueue->save();

                $failed++;
            }
        }

        return response()->json([
            'processed' => $sent + $failed,
            'sent' => $sent,
            'failed' => $failed,
            'remaining' => EmailQueue::where('status', 'pending')->count(),
        ]);
    }

    /**
     * Retourne le nombre d'emails en attente
     */
    public function getQueueStatus()
    {
        $count = EmailQueue::where('status', 'pending')->count();
        
        return response()->json([
            'count' => $count,
            'has_pending' => $count > 0,
        ]);
    }
}

