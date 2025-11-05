<?php

namespace App\Http\Controllers;

use App\Models\Todo;
use App\Models\Subscriber;
use App\Models\EmailQueue;
use App\Services\MailService;
use Illuminate\Http\Request;

class TodoController extends Controller
{
    protected $mailService;

    public function __construct(MailService $mailService)
    {
        $this->mailService = $mailService;
    }
    public function index($listId)
    {
        $todos = Todo::where('list_id', $listId)
            ->orderBy('created_at', 'asc')
            ->get();
        
        return response()->json($todos);
    }

    public function store(Request $request, $listId)
    {
        $this->validate($request, [
            'text' => 'required|string|max:255',
            'pseudo' => 'required|string|max:50',
        ]);

        // Vérifier si l'option auto_assign_to_creator est activée
        $list = \App\Models\TodoList::find($listId);
        $assignedTo = null;
        
        if ($list && $list->auto_assign_to_creator && $list->creator_email) {
            // Récupérer le pseudo du créateur depuis les abonnés
            $creatorSubscriber = \App\Models\Subscriber::where('list_id', $listId)
                ->where('email', $list->creator_email)
                ->first();
            
            if ($creatorSubscriber) {
                $assignedTo = $creatorSubscriber->pseudo ?: 'Créateur';
            }
        }

        $todo = Todo::create([
            'list_id' => $listId,
            'category_id' => $request->input('category_id'),
            'text' => $request->input('text'),
            'pseudo' => $request->input('pseudo'),
            'completed' => false,
            'due_date' => $request->input('due_date'),
            'assigned_to' => $assignedTo,
        ]);

        // Envoyer des notifications aux abonnés
        $this->sendNewTodoNotification($todo);

        return response()->json($todo, 201);
    }
    
    private function sendNewTodoNotification($todo)
    {
        $subscribers = Subscriber::where('list_id', $todo->list_id)->get();
        if ($subscribers->isEmpty()) {
            return;
        }

        // Charger le titre de la liste
        $list = \App\Models\TodoList::find($todo->list_id);
        $listTitle = $list ? $list->title : 'SimpleTodo';

        // Ajouter les emails à la file d'attente au lieu d'envoyer immédiatement
        foreach ($subscribers as $subscriber) {
            $emailBody = "Une nouvelle tâche a été ajoutée : " . $todo->text . "\n\nPar : " . $todo->pseudo;
            
            EmailQueue::create([
                'type' => 'new_todo',
                'recipient_email' => $subscriber->email,
                'subject' => "Nouvelle tâche - " . $listTitle,
                'body' => $emailBody,
                'status' => 'pending',
            ]);
        }
    }

    public function update(Request $request, $listId, $id)
    {
        $todo = Todo::where('list_id', $listId)
            ->where('id', $id)
            ->firstOrFail();

        if ($request->has('text')) {
            $todo->text = $request->input('text');
        }

        if ($request->has('completed')) {
            $wasCompleted = $todo->completed;
            $todo->completed = $request->input('completed');
            
            // Si la tâche vient d'être terminée, envoyer notification
            if (!$wasCompleted && $todo->completed) {
                $this->sendCompletedTodoNotification($todo);
            }
        }

        if ($request->has('pseudo')) {
            $todo->pseudo = $request->input('pseudo');
        }

        if ($request->has('category_id')) {
            $todo->category_id = $request->input('category_id');
        }

        if ($request->has('due_date')) {
            $todo->due_date = $request->input('due_date');
        }

        $todo->save();

        return response()->json($todo);
    }
    
    private function sendCompletedTodoNotification($todo)
    {
        $subscribers = Subscriber::where('list_id', $todo->list_id)->get();
        if ($subscribers->isEmpty()) {
            return;
        }

        // Charger le titre de la liste
        $list = \App\Models\TodoList::find($todo->list_id);
        $listTitle = $list ? $list->title : 'SimpleTodo';

        // Ajouter les emails à la file d'attente au lieu d'envoyer immédiatement
        foreach ($subscribers as $subscriber) {
            $emailBody = "La tâche suivante a été marquée comme terminée : " . $todo->text . "\n\nPar : " . $todo->pseudo;
            
            EmailQueue::create([
                'type' => 'completed_todo',
                'recipient_email' => $subscriber->email,
                'subject' => "Tâche terminée - " . $listTitle,
                'body' => $emailBody,
                'status' => 'pending',
            ]);
        }
    }

    public function assign(Request $request, $listId, $id)
    {
        $todo = Todo::where('list_id', $listId)
            ->where('id', $id)
            ->firstOrFail();

        $this->validate($request, [
            'pseudo' => 'required|string|max:50',
        ]);

        $todo->assigned_to = $request->input('pseudo');
        $todo->save();

        return response()->json($todo);
    }

    public function destroy($listId, $id)
    {
        $todo = Todo::where('list_id', $listId)
            ->where('id', $id)
            ->firstOrFail();

        $todo->delete();

        return response()->json(['message' => 'Todo deleted'], 200);
    }

    public function clearCompleted($listId)
    {
        Todo::where('list_id', $listId)
            ->where('completed', true)
            ->delete();

        return response()->json(['message' => 'Completed todos cleared'], 200);
    }
}
