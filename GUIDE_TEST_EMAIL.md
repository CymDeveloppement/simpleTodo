# Guide : Envoyer un email de test

## ✅ Configuration terminée !

Vous pouvez maintenant tester l'envoi d'emails avec une commande simple.

## 📧 Commande de test

```bash
cd todo
php artisan mail:test votre@email.com
```

## 🎯 Exemples d'utilisation

### Test avec votre email personnel :
```bash
php artisan mail:test mon.email@example.com
```

### Voir toutes les commandes disponibles :
```bash
php artisan help
```

## 📋 Résultat selon le mode

### Mode "log" (développement) :
- L'email sera écrit dans le fichier `storage/logs/lumen-[DATE].log`
- Aucun email réel ne sera envoyé
- Utile pour tester sans consommer de quota

**Exemple de sortie :**
```
✅ Email écrit dans les logs (mode log activé)
📍 Vérifiez le fichier : storage/logs/lumen-2025-10-27.log
```

### Mode "production" (SMTP/Mailgun/SendGrid) :
- Un vrai email sera envoyé
- Vous pouvez vérifier votre boîte de réception

**Exemple de sortie :**
```
✅ Email envoyé avec succès !
📬 Vérifiez votre boîte de réception.
```

## 🧪 Comment tester

1. **Tester en mode log** (actuellement activé) :
```bash
php artisan mail:test test@example.com
tail -f storage/logs/lumen-*.log | grep -A 30 "test@example.com"
```

2. **Passer en production** :
- Modifiez le fichier `todo/.env`
- Changez `MAIL_MAILER=log` vers la configuration de votre choix
- Voir `todo/CONFIG_EMAIL.md` pour les détails

3. **Tester avec un vrai service** :
```bash
php artisan mail:test votre-email-reel@example.com
```

## 📝 Structure de l'email de test

L'email contient :
- Un message de test
- La date et l'heure d'envoi
- Le mode de configuration utilisé
- Le sujet : "Test SimpleTodo - Configuration email"

## 🔍 Dépannage

Si vous avez une erreur :

1. **Vérifiez la configuration dans `.env`** :
```bash
cat todo/.env | grep MAIL_
```

2. **Vérifiez les logs** :
```bash
tail -f todo/storage/logs/lumen-*.log
```

3. **Erreur "Target class [mail.manager] does not exist"** :
   - C'est déjà corrigé ! Redémarrez votre serveur.

4. **Email non reçu en production** :
   - Vérifiez vos identifiants dans `.env`
   - Consultez les logs pour voir les erreurs
   - Vérifiez le dossier spam

## 🎉 Prochaines étapes

Une fois les emails de test fonctionnels :

1. Configurez un service d'email en production (voir `CONFIG_EMAIL.md`)
2. Testez avec un vrai email
3. Le système enverra automatiquement des notifications quand :
   - Une nouvelle tâche est ajoutée
   - Une tâche est terminée
   - Des personnes s'abonnent à votre liste

