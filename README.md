# SimpleTodo - Guide de démarrage

## Installation rapide

### Option 1 · Installateur web (recommandé)

1. Effectuez un déploiement classique du projet (copie des fichiers + configuration du virtual host/serveur PHP).
2. Ouvrez l’URL `/install.php` depuis votre navigateur.
3. Renseignez les informations demandées (email admin, paramètres SMTP, etc.), enregistrez la configuration puis lancez l’installation.
4. Suivez la sortie temps réel ; un journal détaillé est archivé dans `storage/logs/update/install-*.log`.

### Option 2 · Installation manuelle

```bash
composer install
php artisan migrate
php -S localhost:8000 -t public
```

Ouvrez **http://localhost:8000** dans votre navigateur.

### Mise à jour

- Via l’interface : utilisez le bouton “Mettre à jour l’application” (visible pour l’administrateur) qui s’appuie sur `update-bin/update.sh`. Chaque exécution est consignée dans `storage/logs/update/<version>-*.log`.
- En ligne de commande :
  ```bash
  bash update-bin/update.sh            # met à jour la branche courante
  bash update-bin/updateSimpleTodo <tag>  # aligne l’instance sur un tag précis
  ```
- Après chaque mise à jour, `APP_VERSION` est synchronisé dans le `.env` et visible dans le pied de page de l’application.

## Génération de listes via Mistral AI

SimpleTodo peut s’appuyer sur l’API Mistral pour créer automatiquement des listes de tâches structurées.

1. Renseignez votre clé dans le `.env` :
   ```ini
   MISTRAL_API_KEY=sk-xxxxxxxx
   MISTRAL_MODEL=mistral-small-latest
   ```
2. Depuis l’interface, utilisez le bouton “Générer avec Mistral” : fournissez le prompt, éventuellement une date butoir globale (événement) pour que l’IA positionne les échéances de chaque tâche, et choisissez jusqu’à 100 tâches maximales.
3. Programmatique : injectez le service `App\Services\Mistral` là où vous en avez besoin (contrôleur, job…) puis appelez :
   ```php
   $mistral = app(\App\Services\Mistral::class);
   $todo = $mistral->generateTodoList('Préparer un déménagement à Paris', 80, '2025-12-01');
   ```
4. Le service renvoie un tableau avec un titre, un résumé et une liste normalisée d’items (`title`, `description`, `category`, `due_date`, `priority`) que vous pouvez convertir en tâches `Todo`.

Chaque appel loggue les erreurs éventuelles dans les journaux applicatifs. Pensez à limiter les appels pour maîtriser les coûts côté Mistral.

## Comment utiliser

1. **Entrer votre pseudo** : Cliquez dans le champ "Votre pseudo" en haut et entrez votre pseudo (stocké dans localStorage)
2. **Ajouter une tâche** : Utilisez le champ de saisie et cliquez sur "Ajouter" ou appuyez sur Entrée
3. **Marquer comme terminé** : Cliquez sur le bouton circulaire à côté de chaque tâche
4. **Supprimer une tâche** : Cliquez sur l'icône de poubelle
5. **Partager la liste** : Partagez l'URL complète avec d'autres personnes
6. **Supprimer les tâches terminées** : Utilisez le bouton en bas de la liste

## Structure

- `app/` - Code PHP Lumen (backend)
- `public/` - Interface web (frontend + API entry point)
- `database/` - Base de données SQLite
- `config/` - Configuration
- `routes/` - Routes API

## API Endpoints

- `GET /api/todos/{listId}` - Lister les todos
- `POST /api/todos/{listId}` - Créer un todo
- `PUT /api/todos/{listId}/{id}` - Modifier un todo
- `DELETE /api/todos/{listId}/{id}` - Supprimer un todo
- `DELETE /api/todos/{listId}` - Supprimer les todos terminés
