# Guide de configuration des emails - SimpleTodo

## ✅ Configuration effectuée

J'ai configuré le système d'envoi d'emails dans votre projet :

1. ✅ Créé le fichier `.env` dans `todo/`
2. ✅ Créé le fichier `config/services.php` pour les services tiers
3. ✅ Modifié `bootstrap/app.php` pour charger les configurations
4. ✅ Ajouté les packages nécessaires dans `composer.json`

## Installation des dépendances

Avant de configurer un service d'email, installez les dépendances :

```bash
cd todo
composer update
```

## Options de configuration

Vous avez 4 options pour envoyer des emails :

### Option 1 : Mailgun (recommandé - gratuit jusqu'à 5 000 emails/mois)

**Avantages** : Fiable, gratuit pour commencer, facile à configurer

1. Créez un compte sur [https://www.mailgun.com](https://www.mailgun.com)
2. Après inscription, accédez à votre dashboard
3. Notez votre domaine SMTP (ex: `sandbox123.mailgun.org`)
4. Générez un mot de passe SMTP dans les paramètres
5. Modifiez le fichier `todo/.env` :

```env
MAIL_MAILER=mailgun
MAILGUN_SMTP_HOST=smtp.mailgun.org
MAILGUN_SMTP_PORT=587
MAILGUN_SMTP_USERNAME=votre-nom-d-utilisateur-mailgun
MAILGUN_SMTP_PASSWORD=votre-mot-de-passe-mailgun
MAIL_ENCRYPTION=tls
MAIL_FROM_ADDRESS=noreply@votre-domaine.mailgun.org
MAIL_FROM_NAME="SimpleTodo"
```

### Option 2 : SendGrid (gratuit jusqu'à 100 emails/jour)

1. Créez un compte sur [https://sendgrid.com](https://sendgrid.com)
2. Générez une API Key
3. Modifiez le fichier `todo/.env` :

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

**Note** : Pour utiliser Gmail, vous devez créer un "Mot de passe d'application" spécifique.

1. Allez sur [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Générez un mot de passe d'application
3. Modifiez le fichier `todo/.env` :

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

Pour tester sans envoyer de vrais emails, les emails seront écrits dans les logs :

```env
MAIL_MAILER=log
```

Les emails seront écrits dans le fichier `storage/logs/laravel.log`

## Vérification de la configuration

Après avoir modifié `.env`, testez la configuration :

```bash
cd todo
php artisan tinker
```

Puis dans le tinker :

```php
Mail::raw('Test email', function ($message) {
    $message->to('votre-email@test.com')
            ->subject('Test SimpleTodo');
});
```

## Fonctionnalités

Une fois configuré, les utilisateurs qui s'inscrivent pour recevoir des notifications recevront automatiquement :

1. **Nouvelle tâche** : Un email lorsqu'une nouvelle tâche est ajoutée à la liste
2. **Tâche terminée** : Un email lorsqu'une tâche est marquée comme complétée

Les emails sont envoyés de manière non-bloquante avec gestion d'erreurs automatique.

## Notes importantes

- En cas d'erreur d'envoi, les erreurs sont loggées dans `storage/logs/laravel.log`
- Les emails ne bloquent jamais l'application
- Les abonnés peuvent s'inscrire/désinscrire depuis l'interface web

