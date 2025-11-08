<?php

namespace App\Http\Controllers;

use App\Models\Subscriber;
use App\Models\Comment;
use App\Models\User;
use App\Services\MailService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
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

        // Créer ou récupérer l'utilisateur
        $user = User::firstOrCreate(
            ['email' => $request->input('email')],
            [
                'name' => $request->input('pseudo') ?: explode('@', $request->input('email'))[0],
                'email_verified_at' => null,
            ]
        );

        // Connecter l'utilisateur
        Auth::login($user);

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
        // Récupérer l'utilisateur connecté via Auth
        $user = Auth::user();
        
        if (!$user) {
            return response()->json(['message' => 'Utilisateur non authentifié'], 401);
        }
        
        // Récupérer toutes les listes où l'utilisateur est abonné
        $subscribers = Subscriber::where('email', $user->email)->get();
        
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

    public function updateLastViewedComment(Request $request, $listId, $todoId)
    {
        $this->validate($request, [
            'email' => 'required|email|max:255',
            'comment_id' => 'required|integer|min:1',
        ]);

        $email = strtolower(trim($request->input('email')));

        $subscriber = Subscriber::where('list_id', $listId)
            ->whereRaw('lower(email) = ?', [$email])
            ->first();

        if (!$subscriber) {
            return response()->json(['message' => 'Subscriber not found'], 404);
        }

        $metadata = $subscriber->metadata ?? [];
        if (!isset($metadata['comments']) || !is_array($metadata['comments'])) {
            $metadata['comments'] = [];
        }

        $current = (int) ($metadata['comments'][$todoId] ?? 0);
        $newId = (int) $request->input('comment_id');

        if ($newId > $current) {
            $metadata['comments'][$todoId] = $newId;
            $subscriber->metadata = $metadata;
            $subscriber->save();
        }

        $storedId = (int) ($metadata['comments'][$todoId] ?? $current);

        $newComments = Comment::where('list_id', $listId)
            ->where('todo_id', $todoId)
            ->where('id', '>', $storedId)
            ->count();

        return response()->json([
            'stored_comment_id' => $storedId,
            'new_comments' => $newComments,
        ]);
    }

    public function getLastViewedComment(Request $request, $listId, $todoId)
    {
        $this->validate($request, [
            'email' => 'required|email|max:255',
        ]);

        $email = strtolower(trim($request->input('email')));

        $subscriber = Subscriber::where('list_id', $listId)
            ->whereRaw('lower(email) = ?', [$email])
            ->first();

        if (!$subscriber) {
            return response()->json([
                'stored_comment_id' => 0,
                'new_comments' => 0,
            ]);
        }

        $metadata = $subscriber->metadata ?? [];
        $storedId = (int) ($metadata['comments'][$todoId] ?? 0);

        $newComments = Comment::where('list_id', $listId)
            ->where('todo_id', $todoId)
            ->where('id', '>', $storedId)
            ->count();

        return response()->json([
            'stored_comment_id' => $storedId,
            'new_comments' => $newComments,
        ]);
    }

    public function authenticateWithToken($token)
    {
        // Utiliser la méthode statique du modèle User
        $user = User::connectWithToken($token);
        
        if (!$user) {
            return response()->json(['message' => 'Token invalide'], 404);
        }
        
        return response()->json([
            'message' => 'Authentification réussie',
            'email' => $user->email,
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
            ]
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
            $serviceName = env('TODO_SERVICE_NAME', 'SimpleTodo');
            $emailBody = "Bonjour,\n\n";
            $emailBody .= "Voici vos liens d'authentification pour accéder à vos listes de tâches :\n\n";
            
            foreach ($links as $link) {
                $emailBody .= "• {$link['title']} :\n";
                $emailBody .= "  {$link['url']}\n\n";
            }
            
            $emailBody .= "Cliquez sur ces liens pour accéder directement à vos listes.\n\n";
            $emailBody .= "À bientôt sur {$serviceName} !";
            
            $emailSubject = "[{$serviceName}] Vos liens d'authentification";
            
            Mail::raw($emailBody, function ($message) use ($email, $emailSubject) {
                $message->to($email)->subject($emailSubject);
            });
            
            // Logger en mode debug
            if (config('app.debug')) {
                Log::info('Email envoyé - Authentification', [
                    'to' => $email,
                    'subject' => $emailSubject,
                    'body' => $emailBody
                ]);
            }
        } catch (\Exception $e) {
            Log::error('Erreur envoi email authentification : ' . $e->getMessage());
            return response()->json(['message' => 'Erreur lors de l\'envoi de l\'email'], 500);
        }
        
        return response()->json([
            'message' => 'Email envoyé avec succès'
        ]);
    }
}
