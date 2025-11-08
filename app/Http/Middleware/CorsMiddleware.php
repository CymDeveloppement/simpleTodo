<?php

namespace App\Http\Middleware;

use Closure;

class CorsMiddleware
{
    public function handle($request, Closure $next)
    {
        // Gérer les requêtes preflight OPTIONS
        if ($request->getMethod() === 'OPTIONS') {
            $response = response('', 200);
        } else {
            $response = $next($request);
        }

        // Vérifier que la réponse existe avant d'ajouter les headers CORS
        if ($response && isset($response->headers)) {
            // Permettre l'origine de la requête (ou utiliser config pour l'origine spécifique)
            $origin = $request->headers->get('Origin');
            if ($origin) {
                $response->headers->set('Access-Control-Allow-Origin', $origin);
            } else {
                $response->headers->set('Access-Control-Allow-Origin', '*');
            }
            
            $response->headers->set('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
            $response->headers->set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-CSRF-TOKEN');
            $response->headers->set('Access-Control-Allow-Credentials', 'true');
            $response->headers->set('Access-Control-Max-Age', '86400');
        }

        return $response;
    }
}
