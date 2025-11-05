<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\TodoList;
use App\Models\Subscriber;

class HomeController extends Controller
{
    public function index(Request $request, $list = null, $token = null)
    {
        try {
            // Démarrer la session pour le CSRF token
            if (session_status() === PHP_SESSION_NONE) {
                session_start();
            }
            
            // Créer le token CSRF s'il n'existe pas
            if (!isset($_SESSION['csrf_token'])) {
                $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
            }
            
            // Si token passé en paramètre, l'enregistrer en session
            if ($token) {
                $subscriber = Subscriber::where('token', $token)->first();
                
                if ($subscriber) {
                    $_SESSION['simpleTodo_email'] = $subscriber->email;
                }
            }
            
            // Gérer aussi les paramètres query string (pour compatibilité)
            if ($request->has('token') && $request->has('list')) {
                $subscriber = Subscriber::where('token', $request->input('token'))->first();
                
                if ($subscriber) {
                    $_SESSION['simpleTodo_email'] = $subscriber->email;
                }
                
                return redirect('/?list=' . $request->input('list'));
            }
            
            // Vérifier si une liste est demandée
            $listId = $list ?? $request->input('list');
            
            if ($listId) {
                $listFound = TodoList::find($listId);
                if (is_null($listFound)) {
                    return redirect('/');
                }
            }
            
            // Passer l'email depuis la session à la vue
            $email = $_SESSION['simpleTodo_email'] ?? null;
            
            // Retourner la vue Blade
            return view('index', [
                'email' => $email
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'error' => $e->getMessage(),
                'file' => $e->getFile(),
                'line' => $e->getLine(),
                'trace' => $e->getTraceAsString()
            ], 500);
        }
    }
}
