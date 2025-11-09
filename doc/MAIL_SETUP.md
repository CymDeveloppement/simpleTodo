# Configuration de l'envoi d'emails pour SimpleTodo

## Installation

Les dépendances ont déjà été installées via Composer :
- `illuminate/mail` - Laravel Mail
- `guzzlehttp/guzzle` - Pour les requêtes HTTP

## Configuration

### Option 1 : Mailgun (recommandé - gratuit jusqu'à 5 000 emails/mois)

1. Créez un compte gratuit sur [https://www.mailgun.com](https://www.mailgun.com)
2. Vérifiez votre domaine
3. Ajoutez à votre fichier `.env` :

```env
MAIL_MAILER=mailgun
MAILGUN_DOMAIN=votre-domaine.mailgun.org
MAILGUN_SECRET=votre-clé-secrète-mailgun
MAIL_FROM_ADDRESS=noreply@votre-domaine.com
MAIL_FROM_NAME="SimpleTodo"
```

### Option 2 : SendGrid (gratuit jusqu'à 100 emails/jour)

1. Créez un compte gratuit sur [https://sendgrid.com](https://sendgrid.com)
2. Générez une API Key
3. Ajoutez à votre fichier `.env` :

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

### Option 3 : Gmail SMTP

1. Créez un mot de passe d'application Gmail dans vos paramètres Google
2. Ajoutez à votre fichier `.env` :

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

### Option 4 : Mode développement (log seulement)

Pour tester sans envoyer de vrais emails :

```env
MAIL_MAILER=log
```

Les emails seront écrits dans le fichier `storage/logs/laravel.log`

## Utilisation

Une fois configuré, les utilisateurs qui s'inscrivent pour recevoir des notifications recevront automatiquement :

1. **Nouvelle tâche** : Un email lorsqu'une nouvelle tâche est ajoutée à la liste
2. **Tâche terminée** : Un email lorsqu'une tâche est marquée comme complétée

## Notes

- Les emails sont envoyés de manière asynchrone (non bloquant)
- En cas d'erreur d'envoi, les erreurs sont loggées sans interrompre l'application
- Les utilisateurs peuvent s'inscrire/désinscrire depuis l'interface dans les paramètres

