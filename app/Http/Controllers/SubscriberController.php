<?php

namespace App\Http\Controllers;

use App\Models\Subscriber;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;

class SubscriberController extends Controller
{
    protected $mailService;

    public function __construct(MailService $mailService)
    {
        $this->mailService = $mailService;
    }

    public function subscribe(Request $request, $listId)
    {
        $this->validate($request, [
            'email' => 'required|email|max:255',
            'pseudo' => 'nullable|string|max:50',
        ]);

        // Vérifier si l'email existe déjà pour cette liste
        $existing = Subscriber::where('list_id', $listId)
            ->where('email', $request->input('email'))
            ->first();

        if ($existing) {
            return response()->json(['message' => 'Déjà inscrit', 'subscribed' => true], 200);
        }

        // Générer un token unique
        $token = bin2hex(random_bytes(32));

        $subscriber = Subscriber::create([
            'list_id' => $listId,
            'email' => $request->input('email'),
            'pseudo' => $request->input('pseudo'),
            'token' => $token,
            'email_verified' => false,
        ]);

        // Envoyer un email de bienvenue
        $list = \App\Models\TodoList::find($listId);
        $listTitle = $list ? $list->title : 'SimpleTodo';
        $listUrl = request()->getSchemeAndHttpHost() . '/?list=' . $listId . '&token=' . $token;
        
        $this->mailService->sendWelcomeEmail($subscriber, $listTitle, $listUrl);

        return response()->json(['message' => 'Inscription réussie', 'subscribed' => true], 201);
    }

    public function verifyEmail($token)
    {
        $subscriber = Subscriber::where('token', $token)->first();

        if ($subscriber) {
            $subscriber->email_verified = true;
            $subscriber->save();
            
            // Rediriger vers la liste
            $listUrl = request()->getSchemeAndHttpHost() . '/?list=' . $subscriber->list_id;
            return redirect($listUrl);
        }

        return response()->json(['error' => 'Token invalide'], 404);
    }

    public function resendInvitation($listId, $subscriberId)
    {
        $subscriber = Subscriber::where('id', $subscriberId)
            ->where('list_id', $listId)
            ->firstOrFail();

        // Charger le titre de la liste
        $list = \App\Models\TodoList::find($listId);
        $listTitle = $list ? $list->title : 'SimpleTodo';
        
        // Générer l'URL avec le token
        $listUrl = request()->getSchemeAndHttpHost() . '/?list=' . $listId . '&token=' . $subscriber->token;
        
        // Envoyer l'email de bienvenue
        $this->mailService->sendWelcomeEmail($subscriber, $listTitle, $listUrl);

        return response()->json(['message' => 'Lien renvoyé avec succès'], 200);
    }

    public function unsubscribe(Request $request, $listId)
    {
        $this->validate($request, [
            'email' => 'required|email|max:255',
        ]);

        $subscriber = Subscriber::where('list_id', $listId)
            ->where('email', $request->input('email'))
            ->first();

        if ($subscriber) {
            $subscriber->delete();
            return response()->json(['message' => 'Désinscription réussie', 'subscribed' => false], 200);
        }

        return response()->json(['message' => 'Email non trouvé', 'subscribed' => false], 404);
    }

    public function check(Request $request, $listId)
    {
        $this->validate($request, [
            'email' => 'required|email|max:255',
        ]);

        $subscriber = Subscriber::where('list_id', $listId)
            ->where('email', $request->input('email'))
            ->first();

        return response()->json(['subscribed' => $subscriber !== null]);
    }

    public function getAll($listId)
    {
        $subscribers = Subscriber::where('list_id', $listId)->get();
        return response()->json($subscribers);
    }

    public function getMyLists(Request $request)
    {
        // Récupérer l'email depuis la session
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $email = $_SESSION['simpleTodo_email'] ?? null;
        
        if (!$email) {
            return response()->json(['message' => 'Utilisateur non authentifié'], 401);
        }
        
        // Récupérer toutes les listes où l'utilisateur est abonné
        $subscribers = Subscriber::where('email', $email)->get();
        
        $lists = [];
        foreach ($subscribers as $subscriber) {
            $list = \App\Models\TodoList::find($subscriber->list_id);
            if ($list) {
                $lists[] = [
                    'id' => $list->id,
                    'title' => $list->title
                ];
            }
        }
        
        return response()->json($lists);
    }

    public function authenticateWithToken($token)
    {
        // Récupérer le subscriber via le token
        $subscriber = Subscriber::where('token', $token)->first();
        
        if (!$subscriber) {
            return response()->json(['message' => 'Token invalide'], 404);
        }
        
        // Démarrer la session et stocker l'email
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        $_SESSION['simpleTodo_email'] = $subscriber->email;
        
        return response()->json([
            'message' => 'Authentification réussie',
            'email' => $subscriber->email
        ]);
    }

    public function requestAuthEmail(Request $request)
    {
        $this->validate($request, [
            'email' => 'required|email|max:255',
        ]);

        $email = $request->input('email');
        
        // Récupérer toutes les listes où cet email est abonné
        $subscribers = Subscriber::where('email', $email)->get();
        
        if ($subscribers->isEmpty()) {
            return response()->json(['message' => 'Aucune liste trouvée pour cet email'], 404);
        }
        
        $baseUrl = request()->getSchemeAndHttpHost();
        $links = [];
        
        foreach ($subscribers as $subscriber) {
            $list = \App\Models\TodoList::find($subscriber->list_id);
            if ($list) {
                $links[] = [
                    'listId' => $list->id,
                    'title' => $list->title,
                    'url' => $baseUrl . '/' . $list->id . '/' . $subscriber->token
                ];
            }
        }
        
        // Envoyer l'email avec les liens
        try {
            $emailBody = "Bonjour,\n\n";
            $emailBody .= "Voici vos liens d'authentification pour accéder à vos listes de tâches :\n\n";
            
            foreach ($links as $link) {
                $emailBody .= "• {$link['title']} :\n";
                $emailBody .= "  {$link['url']}\n\n";
            }
            
            $emailBody .= "Cliquez sur ces liens pour accéder directement à vos listes.\n\n";
            $emailBody .= "À bientôt sur SimpleTodo !";
            
            Mail::raw($emailBody, function ($message) use ($email) {
                $message->to($email)
                    ->subject('Vos liens d\'authentification SimpleTodo');
            });
        } catch (\Exception $e) {
            \Log::error('Erreur envoi email authentification : ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de l\'envoi de l\'email'], 500);
        }
        
        return response()->json([
            'message' => 'Email envoyé avec succès'
        ]);
    }
}
