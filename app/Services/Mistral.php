<?php

namespace App\Services;

use Illuminate\Http\Client\Factory;
use Illuminate\Http\Client\RequestException;
use Illuminate\Support\Arr;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

/**
 * Service d'intégration avec l'API Mistral AI.
 *
 * Permet de générer une liste de tâches à partir d'une requête utilisateur.
 */
class Mistral
{
    private const API_URL = 'https://api.mistral.ai/v1/chat/completions';

    private Factory $http;
    private string $apiKey;
    private string $model;

    public function __construct(?Factory $http = null, ?string $apiKey = null, ?string $model = null)
    {
        $this->http = $http ?? app(Factory::class);

        $this->apiKey = $apiKey
            ?? Config::get('services.mistral.api_key')
            ?? env('MISTRAL_API_KEY', '');

        if ($this->apiKey === '') {
            throw new \RuntimeException("La clé API Mistral est manquante. Définissez MISTRAL_API_KEY dans votre fichier .env.");
        }

        $this->model = $model
            ?? Config::get('services.mistral.model')
            ?? env('MISTRAL_MODEL', 'mistral-small-latest');
    }

    /**
     * Génère une liste de tâches structurée à partir d'un prompt utilisateur.
     *
     * @param string $prompt Demande de l'utilisateur (ex: "Organise un déménagement").
     * @param int|null $maxItems Nombre maximum de tâches souhaitées (optionnel).
     *
     * @return array{
     *     title: string,
     *     summary: string|null,
     *     items: list<array{
     *         title: string,
     *         description: string|null,
     *         category: string|null,
     *         due_date: string|null,
     *         priority: string
     *     }>
     * }
     */
    public function generateTodoList(string $prompt, ?int $maxItems = null, ?string $deadline = null): array
    {
        $payload = $this->buildRequestPayload($prompt, $maxItems, $deadline);

        try {
            $response = $this->http->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type' => 'application/json',
            ])
                ->timeout(180)
                ->asJson()
                ->post(self::API_URL, $payload)
                ->throw();
        } catch (RequestException $e) {
            Log::error('Erreur lors de l’appel à Mistral', [
                'message' => $e->getMessage(),
                'response' => optional($e->response)->json(),
            ]);

            throw new \RuntimeException('Impossible de contacter Mistral AI. Veuillez réessayer plus tard.', 0, $e);
        }

        $body = $response->json();
        $content = Arr::get($body, 'choices.0.message.content');

        if (!is_string($content) || $content === '') {
            throw new \RuntimeException('Réponse invalide de Mistral AI.');
        }

        return [
            'raw_response' => $body,
            'parsed' => $this->transformResponseToTodoList($content),
        ];
    }

    /**
     * Construit le payload JSON envoyé à l'API Mistral.
     *
     * @param string $prompt
     * @param int|null $maxItems
     * @return array<string, mixed>
     */
    protected function buildRequestPayload(string $prompt, ?int $maxItems, ?string $deadline): array
    {
        $max = $maxItems !== null ? max(1, min($maxItems, 100)) : 12;
        $deadlineLine = '';
        if ($deadline) {
            $deadlineLine = "\n- La date fournie correspond à l'événement : {$deadline}. Pour chaque tâche, déduis une `due_date` réaliste relative à cet événement (préparatifs avant, actions le jour J, suivi éventuel après).\n- N'affecte pas de date arbitraire : si la tâche n'a pas de jalon clair, laisse `due_date` à null.";
        } else {
            $deadlineLine = "\n- N'invente pas de dates si l'utilisateur n'en fournit pas ; utilise null.";
        }

        $instructions = <<<EOT
Tu es un assistant qui crée des listes de tâches pour l'application SimpleTodo.
Retourne exclusivement un JSON valide respectant le schéma suivant :
{
  "title": "Titre court résumant la liste",
  "summary": "Résumé optionnel de la liste ou null",
  "items": [
    {
      "title": "Nom de la tâche (obligatoire)",
      "description": "Détail optionnel ou null",
      "category": "Catégorie courte optionnelle ou null",
      "due_date": "Date ISO YYYY-MM-DD optionnelle ou null",
      "priority": "low|medium|high"
    }
  ]
}

Contraintes :
- Décompose l'activité en au moins {$max} tâches pertinentes (si le sujet s'y prête) et n'excède jamais {$max} items.
- Utilise toujours "priority": "medium" par défaut, "high" uniquement pour les urgences, "low" pour les idées.{$deadlineLine}
- N'ajoute jamais de texte hors JSON.
EOT;

        return [
            'model' => $this->model,
            'temperature' => 0.3,
            'response_format' => ['type' => 'json_object'],
            'messages' => [
                [
                    'role' => 'system',
                    'content' => $instructions,
                ],
                [
                    'role' => 'user',
                    'content' => trim($prompt),
                ],
            ],
        ];
    }

    /**
     * Nettoie et transforme la réponse JSON en structure PHP exploitable.
     *
     * @param string $rawContent
     * @return array
     */
    protected function transformResponseToTodoList(string $rawContent): array
    {
        $cleanContent = Str::of($rawContent)
            ->replace(['```json', '```', "\r"], '')
            ->trim()
            ->value();

        $data = json_decode($cleanContent, true);

        if (json_last_error() !== JSON_ERROR_NONE || !is_array($data)) {
            Log::warning('Impossible de décoder la réponse Mistral', [
                'error' => json_last_error_msg(),
                'raw' => $rawContent,
            ]);

            throw new \RuntimeException('Mistral AI a renvoyé un format inattendu.');
        }

        $title = (string) Arr::get($data, 'title', 'Liste de tâches');
        $summary = Arr::get($data, 'summary');
        $items = Arr::get($data, 'items', []);

        if (!is_array($items)) {
            $items = [];
        }

        $normalizedItems = [];
        foreach ($items as $item) {
            if (!is_array($item)) {
                continue;
            }

            $taskTitle = trim((string) Arr::get($item, 'title', ''));
            if ($taskTitle === '') {
                continue;
            }

            $normalizedItems[] = [
                'title' => $taskTitle,
                'description' => $this->nullIfEmpty(Arr::get($item, 'description')),
                'category' => $this->nullIfEmpty(Arr::get($item, 'category')),
                'due_date' => $this->sanitizeDate($this->nullIfEmpty(Arr::get($item, 'due_date'))),
                'priority' => $this->normalizePriority(Arr::get($item, 'priority')),
            ];
        }

        return [
            'title' => $title === '' ? 'Liste de tâches' : $title,
            'summary' => $this->nullIfEmpty($summary),
            'items' => $normalizedItems,
        ];
    }

    private function nullIfEmpty(mixed $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = trim((string) $value);

        return $string === '' ? null : $string;
    }

    private function sanitizeDate(?string $value): ?string
    {
        if ($value === null) {
            return null;
        }

        $string = trim($value);
        if ($string === '') {
            return null;
        }

        if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $string)) {
            return $string;
        }

        try {
            $date = new \DateTimeImmutable($string);
            return $date->format('Y-m-d');
        } catch (\Exception) {
            return null;
        }
    }

    private function normalizePriority(mixed $value): string
    {
        $allowed = ['low', 'medium', 'high'];
        $priority = strtolower(trim((string) $value));

        return in_array($priority, $allowed, true) ? $priority : 'medium';
    }
}

