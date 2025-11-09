# Système de notifications avec token unique

## ✅ Fonctionnalité ajoutée

Chaque abonné reçoit maintenant un token unique qui permet d'identifier qui a cliqué sur le lien dans l'email.

## 🎯 Fonctionnement

### 1. Inscription
Quand une personne s'inscrit aux notifications :
- Un **token unique** est généré (64 caractères hexadécimaux)
- L'email est marqué comme **non vérifié** (`email_verified = false`)
- Un **email de bienvenue** est envoyé avec un lien contenant le token

### 2. Email de bienvenue
L'email contient :
- Un message de bienvenue
- Le lien vers la liste avec le token : `http://localhost:8000/?list=abc123&token=xyz...`
- Instructions sur ce qui va être notifié

### 3. Clic sur le lien
Quand l'utilisateur clique sur le lien dans l'email :
- L'email est marqué comme **vérifié** (`email_verified = true`)
- Redirection automatique vers la liste
- Le système reconnait l'utilisateur par son token

### 4. Notifications suivantes
Tous les emails de notification (nouvelle tâche, tâche terminée) incluent :
- Le lien vers la liste avec le token unique de l'utilisateur
- Permet de tracker qui a cliqué sur quel lien

## 📋 Modifications effectuées

### Base de données
- **Colonne `token`** : Token unique de 64 caractères
- **Colonne `email_verified`** : Boolean pour indiquer si l'email a été vérifié

### API
- **Route GET `/verify-email/{token}`** : Vérifie un email et redirige vers la liste
- **Controller** : Injection de MailService, génération de token, envoi d'email de bienvenue

### Email
- **sendWelcomeEmail()** : Nouvelle méthode pour envoyer un email de bienvenue
- **Tous les liens** dans les emails incluent maintenant le token de l'utilisateur

## 🔐 Sécurité

- Tokens uniques de 64 caractères (impossibles à deviner)
- Un token par souscripteur et par liste
- Validation lors du clic sur le lien
- Traçabilité des clics sur les liens

## 📧 Contenu de l'email de bienvenue

```
Bienvenue dans la liste '[Nom de la liste]' !

Vous êtes maintenant inscrit pour recevoir des notifications par email.

Vous serez informé de :
• Les nouvelles tâches ajoutées
• Les tâches terminées

Cliquez sur le lien ci-dessous pour accéder à la liste :

http://localhost:8000/?list=abc123&token=xyz789...

Pour vous désinscrire, utilisez le bouton dans les paramètres de la liste.

Bon travail !
```

## 🎯 Cas d'usage

### Traçage des clics
Chaque lien dans les emails est unique :
- Permet de savoir quel utilisateur a cliqué
- Statistiques possibles sur l'engagement
- Identifie les utilisateurs actifs

### Personnalisation future
Le token permet :
- Afficher des informations personnalisées
- Prefill les champs avec les infos de l'utilisateur
- Statut de vérification de l'email

## 📁 Fichiers modifiés

- `todo/app/Models/Subscriber.php` - Ajout des champs token et email_verified
- `todo/app/Http/Controllers/SubscriberController.php` - Génération token, envoi email
- `todo/app/Services/MailService.php` - Nouvelle méthode sendWelcomeEmail
- `todo/routes/web.php` - Route de vérification

## 🧪 Test

1. **Inscrivez-vous** aux notifications avec votre email
2. **Vérifiez votre email** (ou les logs si mode log)
3. **Cliquez sur le lien** dans l'email de bienvenue
4. Vous êtes **redirigé** vers la liste
5. Votre email est maintenant **marqué comme vérifié**

Dans les logs (mode log) :
```bash
tail -f storage/logs/lumen-*.log | grep "Bienvenue"
```

## 📝 Notes

- Le token est généré à l'inscription et ne change jamais
- Un utilisateur peut avoir des tokens différents pour différentes listes
- Les anciens abonnés (sans token) recevront des emails sans token dans les liens
- Pour les nouveaux abonnés, tous les liens incluront automatiquement le token

