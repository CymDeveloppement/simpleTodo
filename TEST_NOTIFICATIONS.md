# Test des notifications par email

## ✅ Configuration effectuée

J'ai configuré votre application pour qu'elle envoie des notifications par email :

1. ✅ Service MailService enregistré dans `bootstrap/app.php`
2. ✅ Configuration email activée (actuellement en mode log pour les tests)
3. ✅ Toutes les tables nécessaires existent (subscribers, todos, etc.)
4. ✅ Le TodoController envoie déjà des notifications lors de l'ajout d'une tâche

## Comment cela fonctionne

### 1. Quand une personne s'abonne aux notifications

Un utilisateur peut s'abonner en entrant son email dans l'interface web (section "Recevoir les notifications"). Son email est stocké dans la table `subscribers` avec le `list_id`.

### 2. Quand une nouvelle tâche est ajoutée

Dans `TodoController::store()`, la méthode `sendNewTodoNotification()` est appelée :
- Elle récupère tous les abonnés de la liste
- Pour chaque abonné, elle envoie un email via `MailService`
- L'email contient : le texte de la tâche, le pseudo de l'auteur, et le lien vers la liste

### 3. Quand une tâche est terminée

Dans `TodoController::update()`, quand une tâche passe de "non terminée" à "terminée" :
- La méthode `sendCompletedTodoNotification()` est appelée
- Un email est envoyé à tous les abonnés

## Test en mode développement

Actuellement, votre configuration est en mode **log** :

```env
MAIL_MAILER=log
```

Cela signifie que les emails seront écrits dans le fichier `storage/logs/laravel.log` au lieu d'être envoyés par email.

### Pour tester

1. **Démarrez le serveur** :
```bash
cd todo
php -S localhost:8000 -t public
```

2. **Ouvrez votre navigateur** sur `http://localhost:8000`

3. **Abonnez-vous aux notifications** :
   - Entrez votre email dans la section "Recevoir les notifications"
   - Cliquez sur "S'inscrire"

4. **Ajoutez une tâche** :
   - Entrez un pseudo
   - Ajoutez une nouvelle tâche

5. **Vérifiez les logs** :
```bash
tail -f storage/logs/laravel.log
```

Vous devriez voir le contenu de l'email dans les logs.

## Passage en production

Pour envoyer de vrais emails, configurez un service d'email dans `.env` :

### Option 1 : Mailgun (recommandé)

```env
MAIL_MAILER=smtp
MAILGUN_SMTP_HOST=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_USERNAME=votre-username-mailgun
MAILGUN_SMTP_PASSWORD=votre-mot-de-passe-mailgun
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@votre-domaine.mailgun.org
MAIL_FROM_NAME="SimpleTodo"
```

### Option 2 : SendGrid

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=votre-clé-api-sendgrid
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@votre-domaine.com
MAIL_FROM_NAME="SimpleTodo"
```

### Option 3 : Gmail

```env
MAIL_MAILER=smtp
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USERNAME=votre-email@gmail.com
MAIL_PASSWORD=votre-mot-de-passe-application
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=votre-email@gmail.com
MAIL_FROM_NAME="SimpleTodo"
```

## Vérification que ça fonctionne

Pour vérifier que les notifications sont envoyées, vous pouvez :

1. **Vérifier les logs** (mode développement) :
```bash
cd todo
tail -f storage/logs/laravel.log | grep "email"
```

2. **Vérifier la base de données** :
```bash
sqlite3 database/database.sqlite "SELECT * FROM subscribers;"
```

3. **Vérifier que MailService est bien appelé** :
Regardez les logs pour voir si des erreurs d'envoi d'email sont enregistrées.

## Fonctionnalités

- ✅ Email envoyé lors de l'ajout d'une nouvelle tâche
- ✅ Email envoyé lorsqu'une tâche est terminée
- ✅ Inscription/désinscription depuis l'interface web
- ✅ Gestion des erreurs (loggées sans bloquer l'application)
- ✅ Lien vers la liste inclus dans chaque email

