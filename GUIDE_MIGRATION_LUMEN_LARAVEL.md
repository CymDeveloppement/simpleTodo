# Guide de Migration : Lumen → Laravel 12

Ce guide détaille les étapes pour migrer votre application Lumen 10 vers Laravel 12.

## 📋 Vue d'ensemble

Lumen est un micro-framework basé sur Laravel, mais il manque certaines fonctionnalités. La migration vers Laravel complet apportera :
- Support complet des sessions
- Système de cache intégré
- Support des queues natif
- Meilleure gestion des fichiers statiques
- Plus de fonctionnalités prêtes à l'emploi

---

## 🔧 Étape 1 : Préparation et sauvegarde

### 1.1 Sauvegarder votre projet
```bash
# Créer une branche de sauvegarde
git checkout -b backup-lumen

# Créer une archive complète
tar -czf backup-lumen-$(date +%Y%m%d).tar.gz .

# Commiter l'état actuel
git add .
git commit -m "Sauvegarde avant migration vers Laravel"
```

### 1.2 Créer une nouvelle branche
```bash
git checkout -b migration-laravel
```

---

## 📦 Étape 2 : Mise à jour de composer.json

### 2.1 Remplacer Lumen par Laravel
Modifier `composer.json` :

**AVANT (Lumen) :**
```json
"require": {
    "php": "^8.0",
    "laravel/lumen-framework": "^10.0",
    "illuminate/mail": "^10.0",
    "guzzlehttp/guzzle": "^7.0",
    "league/flysystem": "^3.0",
    "symfony/mailgun-mailer": "^6.0"
}
```

**APRÈS (Laravel 12) :**
```json
"require": {
    "php": "^8.2",
    "laravel/framework": "^12.0",
    "guzzlehttp/guzzle": "^7.9",
    "league/flysystem": "^3.28",
    "symfony/mailgun-mailer": "^6.4"
}
```

### 2.2 Ajouter les dépendances Laravel
```json
"require-dev": {
    "fakerphp/faker": "^1.23",
    "laravel/pint": "^1.13",
    "laravel/sail": "^1.26",
    "mockery/mockery": "^1.6",
    "nunomaduro/collision": "^8.0",
    "phpunit/phpunit": "^11.0",
    "spatie/laravel-ignition": "^2.4"
}
```

### 2.3 Mettre à jour les scripts
```json
"scripts": {
    "post-autoload-dump": [
        "Illuminate\\Foundation\\ComposerScripts::postAutoloadDump",
        "@php artisan package:discover --ansi"
    ],
    "post-update-cmd": [
        "@php artisan vendor:publish --tag=laravel-assets --ansi --force"
    ],
    "post-root-package-install": [
        "@php -r \"file_exists('.env') || copy('.env.example', '.env');\""
    ],
    "post-create-project-cmd": [
        "@php artisan key:generate --ansi"
    ]
}
```

---

## 🗂️ Étape 3 : Restructuration des dossiers

### 3.1 Créer les dossiers manquants
```bash
mkdir -p app/Providers
mkdir -p app/Http/Middleware
mkdir -p app/Http/Requests
mkdir -p config
mkdir -p database/factories
mkdir -p database/seeders
mkdir -p resources/lang
mkdir -p routes
mkdir -p storage/framework/cache/data
mkdir -p storage/framework/sessions
mkdir -p storage/framework/views
mkdir -p storage/logs
mkdir -p tests/Feature
mkdir -p tests/Unit
```

**Note importante :** Dans Laravel 12, il n'y a plus besoin de :
- `app/Http/Kernel.php` (remplacé par `bootstrap/app.php`)

### 3.2 Créer bootstrap/app.php (Laravel 12)
Le fichier `bootstrap/app.php` de Laravel 12 utilise une structure simplifiée et moderne.

---

## 🔄 Étape 4 : Migration du bootstrap/app.php

### 4.1 Remplacer bootstrap/app.php
Remplacer le contenu actuel par la structure Laravel 12 (simplifiée) :

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
        then: function () {
            Route::middleware('api')
                ->prefix('api')
                ->group(base_path('routes/api.php'));
        },
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Middleware global
        $middleware->web(append: [
            \App\Http\Middleware\EncryptCookies::class,
            \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
            \Illuminate\Session\Middleware\StartSession::class,
            \Illuminate\View\Middleware\ShareErrorsFromSession::class,
            \App\Http\Middleware\VerifyCsrfToken::class,
        ]);
        
        // Middleware API
        $middleware->api(prepend: [
            \App\Http\Middleware\CorsMiddleware::class,
        ]);
        
        // Alias middleware (optionnel)
        $middleware->alias([
            'auth' => \App\Http\Middleware\Authenticate::class,
            'guest' => \App\Http\Middleware\RedirectIfAuthenticated::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

### 4.2 Ajouter l'import Route
N'oubliez pas d'ajouter en haut du fichier :
```php
use Illuminate\Support\Facades\Route;
```

---

## 🛣️ Étape 5 : Migration des routes

### 5.1 Convertir routes/web.php
Les routes Lumen utilisent `$router`, Laravel utilise `Route`.

**AVANT (Lumen) :**
```php
$router->get('/api/todos/{listId}', 'App\Http\Controllers\TodoController@index');
```

**APRÈS (Laravel) :**
```php
use Illuminate\Support\Facades\Route;

Route::get('/api/todos/{listId}', [App\Http\Controllers\TodoController::class, 'index']);
```

### 5.2 Créer routes/api.php (optionnel mais recommandé)
Séparer les routes API dans un fichier dédié :
```php
<?php

use Illuminate\Support\Facades\Route;

Route::prefix('api')->group(function () {
    Route::get('/', function () {
        return ['message' => 'SimpleTodo API'];
    });
    
    Route::get('/todos/{listId}', [App\Http\Controllers\TodoController::class, 'index']);
    // ... autres routes API
});
```

### 5.3 Créer routes/console.php
Pour les commandes Artisan personnalisées :
```php
<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote')->hourly();
```

---

## 🎛️ Étape 6 : Migration des contrôleurs

### 6.1 Mettre à jour Controller.php
**AVANT (Lumen) :**
```php
use Laravel\Lumen\Routing\Controller as BaseController;
```

**APRÈS (Laravel) :**
```php
use Illuminate\Routing\Controller as BaseController;
```

### 6.2 Vérifier les contrôleurs
Tous les contrôleurs doivent hériter de `App\Http\Controllers\Controller`.

---

## 🔧 Étape 7 : Migration du Console Kernel

### 7.1 Mettre à jour app/Console/Kernel.php
**AVANT (Lumen) :**
```php
use Laravel\Lumen\Console\Kernel as ConsoleKernel;
```

**APRÈS (Laravel) :**
```php
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;
```

---

## ⚙️ Étape 8 : Configuration des Services (Laravel 12 simplifié)

### 8.1 Créer app/Providers/AppServiceProvider.php
Créer le Service Provider pour enregistrer vos services :

```php
<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use App\Services\MailService;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        // Enregistrer MailService
        $this->app->singleton(MailService::class, function ($app) {
            return new MailService($app);
        });
    }

    public function boot(): void
    {
        //
    }
}
```

### 8.2 Enregistrer le Service Provider dans bootstrap/app.php
Dans `bootstrap/app.php`, ajoutez le provider dans la méthode `withProviders()` :

```php
<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(...)
    ->withMiddleware(...)
    ->withProviders([
        App\Providers\AppServiceProvider::class,
    ])
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })->create();
```

**Note :** Dans Laravel 12, les Service Providers sont toujours la méthode recommandée pour enregistrer des services. Créez le dossier `app/Providers` si nécessaire.

---

## 🛡️ Étape 9 : Migration du middleware (Laravel 12)

### 9.1 Configuration dans bootstrap/app.php
**IMPORTANT :** Dans Laravel 12, il n'y a **plus de Kernel.php**. Tout est configuré dans `bootstrap/app.php` via la méthode `withMiddleware()`.

La configuration du middleware se fait directement dans `bootstrap/app.php` comme montré à l'Étape 4.

### 9.2 Créer les middleware manquants
Créer les middleware de base Laravel si nécessaire :
- `app/Http/Middleware/EncryptCookies.php`
- `app/Http/Middleware/VerifyCsrfToken.php`
- `app/Http/Middleware/Authenticate.php`
- `app/Http/Middleware/RedirectIfAuthenticated.php`
- `app/Http/Middleware/CorsMiddleware.php` (déjà existant)

**Utiliser les commandes Artisan :**
```bash
php artisan make:middleware EncryptCookies
php artisan make:middleware VerifyCsrfToken
php artisan make:middleware Authenticate
php artisan make:middleware RedirectIfAuthenticated
```

### 9.3 Exemple de middleware EncryptCookies
```php
<?php

namespace App\Http\Middleware;

use Illuminate\Cookie\Middleware\EncryptCookies as Middleware;

class EncryptCookies extends Middleware
{
    protected $except = [
        //
    ];
}
```

### 9.4 Exemple de middleware VerifyCsrfToken
```php
<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    protected $except = [
        'api/*',
    ];
}
```

**Note :** Les middleware `TrustProxies`, `PreventRequestsDuringMaintenance`, `TrimStrings`, etc. sont gérés automatiquement par Laravel 12 et n'ont pas besoin d'être créés manuellement.

---

## 📝 Étape 10 : Migration de public/index.php

### 10.1 Remplacer public/index.php
**AVANT (Lumen) :**
```php
$app = require_once __DIR__.'/../bootstrap/app.php';
$app->run();
```

**APRÈS (Laravel) :**
```php
<?php

use Illuminate\Contracts\Http\Kernel;
use Illuminate\Http\Request;

define('LARAVEL_START', microtime(true));

require __DIR__.'/../vendor/autoload.php';

$app = require_once __DIR__.'/../bootstrap/app.php';

$kernel = $app->make(Kernel::class);

$response = $kernel->handle(
    $request = Request::capture()
)->send();

$kernel->terminate($request, $response);
```

---

## ⚙️ Étape 11 : Migration de la configuration

### 11.1 Mettre à jour config/app.php
Le fichier `config/app.php` de Laravel 12 est simplifié. Voici la structure minimale :

```php
<?php

use Illuminate\Support\Facades\Facade;

return [
    'name' => env('APP_NAME', 'Laravel'),
    'env' => env('APP_ENV', 'production'),
    'debug' => (bool) env('APP_DEBUG', false),
    'url' => env('APP_URL', 'http://localhost'),
    'timezone' => 'UTC',
    'locale' => 'fr',
    'fallback_locale' => 'en',
    'faker_locale' => 'fr_FR',
    'key' => env('APP_KEY'),
    'cipher' => 'AES-256-CBC',
    'maintenance' => [
        'driver' => env('APP_MAINTENANCE_DRIVER', 'file'),
        'store' => env('APP_MAINTENANCE_STORE', 'database'),
    ],
];

Facade::clearResolvedInstances();
Facade::setFacadeApplication(app());
```

**Note :** Laravel 12 a simplifié la configuration. Vous pouvez copier le fichier complet depuis une installation Laravel 12 fraîche avec `php artisan config:publish` ou créer manuellement un fichier minimal.

### 11.2 Vérifier les autres fichiers de configuration
- `config/database.php` - devrait être compatible
- `config/mail.php` - devrait être compatible
- `config/services.php` - devrait être compatible
- `config/view.php` - devrait être compatible

---

## 🔐 Étape 12 : Gestion des sessions et CSRF

### 12.1 Configurer les sessions
Dans Laravel 12, vous pouvez publier la configuration des sessions :
```bash
php artisan config:publish session
```

Ou créer manuellement `config/session.php` avec la configuration minimale :
```php
<?php

return [
    'driver' => env('SESSION_DRIVER', 'file'),
    'lifetime' => env('SESSION_LIFETIME', 120),
    'encrypt' => false,
    'files' => storage_path('framework/sessions'),
    'connection' => env('SESSION_CONNECTION'),
    'table' => 'sessions',
    'store' => env('SESSION_STORE'),
    'lottery' => [2, 100],
    'cookie' => env(
        'SESSION_COOKIE',
        \Illuminate\Support\Str::slug(env('APP_NAME', 'laravel'), '_').'_session'
    ),
    'path' => '/',
    'domain' => env('SESSION_DOMAIN'),
    'secure' => env('SESSION_SECURE_COOKIE'),
    'http_only' => true,
    'same_site' => 'lax',
    'partitioned' => false,
];
```

### 12.2 Mettre à jour VerifyCsrfToken.php
```php
<?php

namespace App\Http\Middleware;

use Illuminate\Foundation\Http\Middleware\VerifyCsrfToken as Middleware;

class VerifyCsrfToken extends Middleware
{
    protected $except = [
        // Ajouter vos routes API qui ne nécessitent pas CSRF
        'api/*',
    ];
}
```

---

## 🧪 Étape 13 : Migration des tests

### 13.1 Créer la structure de tests
```bash
mkdir -p tests/Feature
mkdir -p tests/Unit
```

### 13.2 Créer tests/TestCase.php
```php
<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    use CreatesApplication;
}
```

### 13.3 Créer tests/CreatesApplication.php
```php
<?php

namespace Tests;

use Illuminate\Contracts\Console\Kernel;
use Illuminate\Foundation\Application;

trait CreatesApplication
{
    public function createApplication(): Application
    {
        $app = require __DIR__.'/../bootstrap/app.php';

        $app->make(Kernel::class)->bootstrap();

        return $app;
    }
}
```

---

## 📦 Étape 14 : Mise à jour des dépendances

### 14.1 Supprimer l'ancien vendor
```bash
rm -rf vendor/
```

### 14.2 Installer les nouvelles dépendances
```bash
# Supprimer composer.lock pour forcer la mise à jour
rm composer.lock

# Installer les nouvelles dépendances Laravel 12
composer require laravel/framework:^12.0 --with-all-dependencies

# Installer les dépendances de développement
composer require --dev fakerphp/faker laravel/pint laravel/sail mockery/mockery nunomaduro/collision phpunit/phpunit spatie/laravel-ignition
```

### 14.3 Générer la clé d'application
```bash
php artisan key:generate
```

### 14.4 Publier les fichiers de configuration (si nécessaire)
```bash
# Publier toutes les configurations
php artisan config:publish

# Ou publier spécifiquement
php artisan config:publish session
php artisan config:publish database
php artisan config:publish mail
```

---

## 🔍 Étape 15 : Migration des helpers personnalisés

### 15.1 Vérifier les fonctions helper
Dans `bootstrap/app.php` de Lumen, vous aviez des fonctions helper :
- `resource_path()`
- `database_path()`
- `csrf_token()`

Ces fonctions existent déjà dans Laravel, supprimez leurs définitions personnalisées.

### 15.2 Créer app/helpers.php (si nécessaire)
Si vous avez des helpers personnalisés, créez `app/helpers.php` et enregistrez-le dans `composer.json` :
```json
"autoload": {
    "psr-4": {
        "App\\": "app/"
    },
    "files": [
        "app/helpers.php"
    ]
}
```

---

## 🗄️ Étape 16 : Base de données et migrations

### 16.1 Vérifier les migrations
Les migrations devraient être compatibles. Vérifiez qu'elles utilisent bien `Illuminate\Database\Migrations\Migration`.

### 16.2 Exécuter les migrations
```bash
php artisan migrate
```

---

## 🚀 Étape 17 : Tests et validation

### 17.1 Vérifier que l'application démarre
```bash
php artisan serve
```

### 17.2 Tester les routes
- Tester toutes les routes API
- Vérifier que les vues se chargent correctement
- Tester les fonctionnalités principales

### 17.3 Vérifier les logs
```bash
tail -f storage/logs/laravel.log
```

---

## 🔧 Étape 18 : Ajustements finaux

### 18.1 Nettoyer le code
- Supprimer les références à `Laravel\Lumen`
- Vérifier que tous les imports sont corrects
- Supprimer les fichiers obsolètes

### 18.2 Mettre à jour .env
Vérifier que toutes les variables d'environnement sont correctes :
```
APP_NAME="SimpleTodo"
APP_ENV=local
APP_KEY=base64:... (généré par artisan key:generate)
APP_DEBUG=true
APP_URL=http://localhost:8000
```

### 18.3 Optimiser Laravel
```bash
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

---

## 📋 Checklist finale

- [ ] `composer.json` mis à jour (Lumen → Laravel 12, PHP ^8.2)
- [ ] `bootstrap/app.php` migré vers Laravel 12 (structure simplifiée)
- [ ] Routes converties (`$router` → `Route`)
- [ ] Contrôleurs mis à jour
- [ ] Services enregistrés (dans `bootstrap/app.php` ou Service Provider)
- [ ] Middleware configuré dans `bootstrap/app.php` (pas de Kernel.php)
- [ ] `public/index.php` mis à jour
- [ ] Configuration complète (config/app.php, session, etc.)
- [ ] Sessions et CSRF configurés
- [ ] Tests créés
- [ ] Dépendances installées (Laravel 12)
- [ ] Clé d'application générée
- [ ] Migrations exécutées
- [ ] Application testée
- [ ] Logs vérifiés

---

## 🐛 Dépannage

### Erreur : "Class 'Laravel\Lumen\...' not found"
- Vérifier que tous les imports ont été mis à jour
- Chercher les références à Lumen dans le code

### Erreur : "Route not found"
- Vérifier que les routes utilisent la syntaxe Laravel
- Exécuter `php artisan route:list` pour voir les routes

### Erreur : "Session driver not found"
- Configurer `config/session.php`
- Vérifier les permissions sur `storage/framework/sessions`

### Erreur : "CSRF token mismatch"
- Vérifier que les routes API sont exclues dans `VerifyCsrfToken`
- Vérifier les headers dans les requêtes AJAX

---

## 📚 Ressources

- [Documentation Laravel 12](https://laravel.com/docs/12.x)
- [Guide de migration Laravel 11](https://laravel.com/docs/12.x/upgrade)
- [Laravel 12 - Nouveautés](https://laravel.com/docs/12.x/releases)
- [Structure simplifiée Laravel 11+](https://laravel.com/docs/12.x/structure)

---

## ⚠️ Notes importantes

1. **Sauvegardez toujours avant de migrer**
2. **Testez dans un environnement de développement d'abord**
3. **Migrez étape par étape et testez après chaque étape**
4. **Certaines fonctionnalités Lumen peuvent nécessiter des ajustements**
5. **Les routes doivent être converties manuellement**
6. **Dans Laravel 12, il n'y a plus de Kernel.php - tout se configure dans bootstrap/app.php**
7. **PHP 8.2+ est requis pour Laravel 12**
8. **Les Service Providers sont toujours la méthode recommandée pour enregistrer des services**
9. **La structure de Laravel 12 est simplifiée par rapport à Laravel 10**

## 🔄 Différences principales Laravel 10 → Laravel 12

### Structure simplifiée
- ❌ **Plus de** `app/Http/Kernel.php` - configuration dans `bootstrap/app.php`
- ✅ **Service Providers** enregistrés via `withProviders()` dans `bootstrap/app.php`
- ✅ **Configuration centralisée** dans `bootstrap/app.php`
- ✅ **PHP 8.2+ requis**

### Configuration
- Middleware configuré via `withMiddleware()` dans `bootstrap/app.php`
- Routes configurées via `withRouting()` dans `bootstrap/app.php`
- Service Providers enregistrés via `withProviders()` dans `bootstrap/app.php`

---

**Bon courage avec votre migration ! 🚀**

