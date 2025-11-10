<?php

namespace App\Http\Controllers;

use App\Services\Mistral;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MistralController extends Controller
{
    public function generate(Request $request, Mistral $mistral): JsonResponse
    {
        $adminEmail = strtolower(trim((string) env('ADMIN_EMAIL')));

        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $sessionEmail = null;
        if (session_status() === PHP_SESSION_ACTIVE && isset($_SESSION['simpleTodo_email'])) {
            $sessionEmail = strtolower(trim((string) $_SESSION['simpleTodo_email']));
        }

        $requestEmail = strtolower(trim((string) ($request->input('email') ?? $request->header('X-User-Email') ?? '')));

        $authorized = $adminEmail && ((
            $sessionEmail && $sessionEmail === $adminEmail
        ) || (
            $requestEmail && $requestEmail === $adminEmail
        ));

        if (!$authorized) {
            return response()->json([
                'message' => 'Accès refusé',
            ], 403);
        }

        $data = $request->validate([
            'prompt' => 'required|string|max:2000',
            'max_items' => 'nullable|integer|min:1|max:100',
            'deadline' => 'nullable|date_format:Y-m-d',
            'list_id' => 'nullable|string|max:255',
        ]);

        try {
            $result = $mistral->generateTodoList(
                $data['prompt'],
                $data['max_items'] ?? null,
                $data['deadline'] ?? null
            );
        } catch (\Throwable $e) {
            report($e);

            return response()->json([
                'message' => "Impossible de générer la liste avec Mistral AI. Veuillez réessayer plus tard.",
            ], 502);
        }

        return response()->json([
            'title' => $result['parsed']['title'],
            'summary' => $result['parsed']['summary'],
            'items' => $result['parsed']['items'],
            'ai' => $result['raw_response'],
        ]);
    }
}
