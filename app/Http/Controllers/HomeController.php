<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\TodoList;
use App\Models\User;

class HomeController extends Controller
{
    public function index(Request $request, $list = null, $token = null)
    {
        try {
            // Si token passé en paramètre, connecter l'utilisateur
            if ($token) {
                $connectedUser = User::connectWithToken($token);
                if (config('app.debug') && $connectedUser) {
                    // Trouver la vraie clé de login dans la session
                    $loginKeys = array_filter(
                        array_keys(session()->all()),
                        fn($key) => str_starts_with($key, 'login_web_')
                    );
                    
                    \Log::debug('HomeController - After connectWithToken', [
                        'user_id' => $connectedUser->id,
                        'auth_check' => Auth::check(),
                        'login_keys' => $loginKeys,
                        'login_values' => array_map(fn($key) => session()->get($key), $loginKeys),
                        'session_all' => array_keys(session()->all()),
                    ]);
                }
            }
            
            // Gérer aussi les paramètres query string (pour compatibilité)
            if ($request->has('token') && $request->has('list')) {
                $connectedUser = User::connectWithToken($request->input('token'));
                if (config('app.debug') && $connectedUser) {
                    // Trouver la vraie clé de login dans la session
                    $loginKeys = array_filter(
                        array_keys(session()->all()),
                        fn($key) => str_starts_with($key, 'login_web_')
                    );
                    
                    \Log::debug('HomeController - After connectWithToken (redirect)', [
                        'user_id' => $connectedUser->id,
                        'auth_check' => Auth::check(),
                        'login_keys' => $loginKeys,
                        'login_values' => array_map(fn($key) => session()->get($key), $loginKeys),
                    ]);
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
            
            // Récupérer l'utilisateur connecté via Auth
            $user = Auth::user();
            
            // Debug: vérifier si l'utilisateur est connecté
            if (config('app.debug')) {
                // Laravel utilise une clé spécifique pour l'authentification
                // Chercher toutes les clés qui commencent par login_web_
                $sessionKeys = array_filter(
                    array_keys(session()->all()),
                    fn($key) => str_starts_with($key, 'login_web_')
                );
                
                \Log::debug('HomeController - User auth check', [
                    'user' => $user ? $user->email : 'null',
                    'user_id' => $user ? $user->id : null,
                    'check' => Auth::check(),
                    'guard' => Auth::getDefaultDriver(),
                    'session_id' => session()->getId(),
                    'login_keys' => $sessionKeys,
                    'login_values' => array_map(fn($key) => session()->get($key), $sessionKeys),
                ]);
            }

            // Retourner la vue Blade
            return view('index', [
                'email' => $user?->email,
                'user' => $user
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
