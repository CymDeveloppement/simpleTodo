<?php

namespace App\Http\Controllers;

use App\Models\Comment;
use Illuminate\Http\Request;

class CommentController extends Controller
{
    public function index($listId, $todoId)
    {
        $comments = Comment::where('list_id', $listId)
            ->where('todo_id', $todoId)
            ->orderBy('created_at', 'asc')
            ->get();
        
        return response()->json($comments);
    }

    public function store(Request $request, $listId, $todoId)
    {
        $this->validate($request, [
            'text' => 'required|string|max:500',
            'pseudo' => 'required|string|max:50',
        ]);

        $comment = Comment::create([
            'todo_id' => $todoId,
            'list_id' => $listId,
            'text' => $request->input('text'),
            'pseudo' => $request->input('pseudo'),
        ]);

        return response()->json($comment, 201);
    }

    public function destroy($listId, $todoId, $id)
    {
        $comment = Comment::where('list_id', $listId)
            ->where('todo_id', $todoId)
            ->where('id', $id)
            ->firstOrFail();

        $comment->delete();

        return response()->json(['message' => 'Comment deleted'], 200);
    }
}
