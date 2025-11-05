<?php

namespace App\Http\Controllers;

use App\Models\TodoList;
use Illuminate\Http\Request;

class ListController extends Controller
{
    public function show(Request $request, $listId)
    {
        // Vérifier et ajouter la colonne auto_assign_to_creator si elle n'existe pas
        $this->ensureAutoAssignColumnExists();
        
        $list = TodoList::find($listId);
        
        if (!$list) {
            return response()->json([
                'title' => 'SimpleTodo',
                'creator_email' => null,
                'is_creator' => false,
                'is_subscriber' => false
            ]);
        }
        
        // Récupérer l'email depuis la session ou le query parameter
        $userEmail = null;
        
        // Démarrer la session si elle n'est pas démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['simpleTodo_email'])) {
            $userEmail = $_SESSION['simpleTodo_email'];
        } else {
            $userEmail = $request->query('email');
        }
        
        // Vérifier si l'utilisateur est le créateur
        $adminEmail = env('ADMIN_EMAIL');
        $isAdmin = $userEmail && $adminEmail && $userEmail === $adminEmail;
        $isCreator = $userEmail && $userEmail === $list->creator_email;
        
        // Vérifier si l'utilisateur est abonné
        $isSubscriber = false;
        if ($userEmail) {
            $isSubscriber = \App\Models\Subscriber::where('list_id', $listId)
                ->where('email', $userEmail)
                ->exists();
        }
        
        return response()->json([
            'title' => $list->title,
            'header_gradient' => $list->header_gradient,
            'creator_email' => $list->creator_email,
            'is_creator' => $isCreator || $isAdmin,
            'is_subscriber' => $isSubscriber,
            'auto_assign_to_creator' => (bool) $list->auto_assign_to_creator
        ]);
    }

    public function store(Request $request, $listId)
    {
        $this->validate($request, [
            'title' => 'required|string|max:100',
            'creator_email' => 'nullable|email|max:255',
        ]);

        $list = TodoList::firstOrNew(['id' => $listId]);
        $list->title = $request->input('title');
        
        // Déterminer si c'est une nouvelle liste
        $isNew = !$list->exists;
        
        // Enregistrer le créateur uniquement si la liste est nouvelle
        if ($isNew || !$list->creator_email) {
            $list->creator_email = $request->input('creator_email');
        }
        
        $list->save();
        
        // Si c'est une nouvelle liste, s'abonner automatiquement le créateur
        if ($isNew && $request->input('creator_email')) {
            $creatorEmail = $request->input('creator_email');
            
            // Vérifier si le créateur n'est pas déjà abonné
            $alreadySubscribed = \App\Models\Subscriber::where('list_id', $listId)
                ->where('email', $creatorEmail)
                ->exists();
            
            if (!$alreadySubscribed) {
                // Générer un token pour le créateur
                $token = bin2hex(random_bytes(32));
                
                // Ajouter le créateur comme abonné
                \App\Models\Subscriber::create([
                    'list_id' => $listId,
                    'email' => $creatorEmail,
                    'pseudo' => 'Créateur',
                    'token' => $token,
                    'email_verified' => 1
                ]);
            }
        }

        return response()->json($list, 201);
    }

    public function update(Request $request, $listId)
    {
        $this->validate($request, [
            'title' => 'nullable|string|max:100',
            'header_gradient' => 'nullable|string|max:20',
            'auto_assign_to_creator' => 'nullable|boolean',
        ]);

        // Vérifier et ajouter la colonne auto_assign_to_creator si elle n'existe pas
        $this->ensureAutoAssignColumnExists();

        $list = TodoList::findOrFail($listId);
        
        // Démarrer la session si elle n'est pas démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Vérifier si l'utilisateur est le créateur pour les modifications du gradient et du titre
        $userEmail = null;
        
        // Essayer d'abord depuis la session
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['simpleTodo_email'])) {
            $userEmail = $_SESSION['simpleTodo_email'];
        } else {
            // Fallback sur query parameter
            $userEmail = $request->query('email');
        }
        
        $adminEmail = env('ADMIN_EMAIL');
        $isAdmin = $userEmail && $adminEmail && $userEmail === $adminEmail;
        $isCreator = $userEmail && $userEmail === $list->creator_email;
        
        if (!($isCreator || $isAdmin)) {
            return response()->json(['error' => 'Seul le créateur peut modifier la liste'], 403);
        }
        
        if ($request->has('title')) {
            $list->title = $request->input('title');
        }
        
        if ($request->has('header_gradient')) {
            $list->header_gradient = $request->input('header_gradient');
        }
        
        if ($request->has('auto_assign_to_creator')) {
            $list->auto_assign_to_creator = $request->input('auto_assign_to_creator') ? 1 : 0;
        }
        
        $list->save();

        return response()->json($list);
    }

    public function destroy(Request $request, $listId)
    {
        $list = TodoList::findOrFail($listId);
        
        // Démarrer la session si elle n'est pas démarrée
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }
        
        // Vérifier si l'utilisateur est le créateur
        $userEmail = null;
        
        // Essayer d'abord depuis la session
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['simpleTodo_email'])) {
            $userEmail = $_SESSION['simpleTodo_email'];
        } else {
            // Fallback sur query parameter
            $userEmail = $request->query('email');
        }
        
        $adminEmail = env('ADMIN_EMAIL');
        $isAdmin = $userEmail && $adminEmail && $userEmail === $adminEmail;
        $isCreator = $userEmail && $userEmail === $list->creator_email;
        
        if (!($isCreator || $isAdmin)) {
            return response()->json(['error' => 'Seul le créateur peut supprimer la liste'], 403);
        }
        
        // Supprimer toutes les tâches associées
        \App\Models\Todo::where('list_id', $listId)->delete();
        
        // Supprimer tous les abonnés
        \App\Models\Subscriber::where('list_id', $listId)->delete();
        
        // Supprimer toutes les catégories
        \App\Models\Category::where('list_id', $listId)->delete();
        
        // Supprimer la liste
        $list->delete();
        
        return response()->json(['message' => 'Liste supprimée avec succès'], 200);
    }

    /**
     * Vérifier et ajouter la colonne auto_assign_to_creator si elle n'existe pas
     */
    private function ensureAutoAssignColumnExists()
    {
        try {
            $db = \DB::connection()->getPdo();
            
            // Vérifier si la colonne existe déjà
            $stmt = $db->query("PRAGMA table_info(lists)");
            $columns = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            $columnExists = false;
            
            foreach ($columns as $column) {
                if ($column['name'] === 'auto_assign_to_creator') {
                    $columnExists = true;
                    break;
                }
            }
            
            if (!$columnExists) {
                $db->exec("ALTER TABLE lists ADD COLUMN auto_assign_to_creator INTEGER DEFAULT 0");
            }
        } catch (\Exception $e) {
            // Ignorer les erreurs silencieusement
        }
    }
}
