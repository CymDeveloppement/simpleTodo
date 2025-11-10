<?php

namespace App\Http\Controllers;

use App\Services\Mistral;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MistralController extends Controller
{
    public function generate(Request $request, Mistral $mistral): JsonResponse
    {
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
