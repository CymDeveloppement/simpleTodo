#!/bin/bash

echo "=== Démarrage de SimpleTodo ==="
echo ""

# Vérifier si Composer est installé
if ! command -v composer &> /dev/null
then
    echo "❌ Composer n'est pas installé"
    exit 1
fi

# Installer les dépendances si nécessaire
if [ ! -d "vendor" ]; then
    echo "📦 Installation des dépendances PHP..."
    composer install
fi

# Créer la base de données si elle n'existe pas
if [ ! -f "database/database.sqlite" ]; then
    echo "🗄️  Initialisation de la base de données..."
    php artisan migrate
fi

echo ""
echo "✅ Installation terminée!"
echo ""
echo "🎉 Pour démarrer l'application, exécutez:"
echo "   php -S localhost:8000 -t public"
echo ""
echo "   Puis ouvrez http://localhost:8000 dans votre navigateur"
echo ""
