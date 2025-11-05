#!/bin/bash

# Script de sauvegarde et déplacement de SimpleTodo

echo "📦 Sauvegarde de SimpleTodo..."
echo ""

# Créer un fichier tar avec tout le projet
cd /Projet/dev/AED-PMSI/simpleToDo/
tar -czf simpletodo_backup.tar.gz todo/

echo "✅ Sauvegarde créée : simpletodo_backup.tar.gz"
echo ""

# Copier le projet dans un endroit temporaire
BACKUP_DIR="$HOME/backup_simpletodo"
mkdir -p "$BACKUP_DIR"
cp -r todo "$BACKUP_DIR/"
echo "✅ Copie de sauvegarde dans : $BACKUP_DIR"
echo ""

echo "📋 Pour restaurer sur une nouvelle machine :"
echo "1. Copiez le dossier todo/ ou le fichier tar.gz"
echo "2. Décomprimez si nécessaire : tar -xzf simpletodo_backup.tar.gz"
echo "3. Allez dans le dossier todo/"
echo "4. Installez les dépendances : composer install"
echo "5. Initialisez la base : php artisan"
echo "6. Démarrez : php -S localhost:8000 -t public"
echo ""

echo "📄 Consultez SESSION_SAVE.md pour un résumé complet"

