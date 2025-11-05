# SimpleTodo - Guide de démarrage

## Installation rapide

```bash
composer install
php artisan migrate
php -S localhost:8000 -t public
```

Ouvrez **http://localhost:8000** dans votre navigateur.

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
