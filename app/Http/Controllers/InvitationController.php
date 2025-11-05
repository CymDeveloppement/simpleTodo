<?php

namespace App\Http\Controllers;

use App\Services\MailService;
use Illuminate\Http\Request;

class InvitationController extends Controller
{
    protected $mailService;

    public function __construct(MailService $mailService)
    {
        $this->mailService = $mailService;
    }

    public function send(Request $request, $listId)
    {
        $this->validate($request, [
            'email' => 'required|email|max:255',
            'invited_by' => 'nullable|string|max:50',
        ]);

        // Charger le titre de la liste
        $list = \App\Models\TodoList::find($listId);
        $listTitle = $list ? $list->title : 'SimpleTodo';

        // Récupérer le pseudo de l'inviteur
        $invitedBy = $request->input('invited_by', 'Quelqu\'un');
        
        // Générer l'URL de la liste avec l'email en paramètre
        $email = $request->input('email');
        $listUrl = request()->getSchemeAndHttpHost() . '/?list=' . $listId . '&email=' . urlencode($email);

        // Envoyer l'invitation
        $this->mailService->sendInvitation(
            $email,
            $invitedBy,
            $listTitle,
            $listUrl
        );

        return response()->json(['message' => 'Invitation envoyée avec succès'], 200);
    }
}

