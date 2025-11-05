<?php

namespace App\Console\Commands;

class MigrateCommand
{
    public function handle()
    {
        echo "Running migrations...\n";
        
        $databaseDir = dirname(dirname(dirname(__DIR__))) . '/database/';
        $databasePath = $databaseDir . 'database.sqlite';
        
        if (!is_dir($databaseDir)) {
            mkdir($databaseDir, 0755, true);
        }
        
        if (!file_exists($databasePath)) {
            touch($databasePath);
            chmod($databasePath, 0666);
        }
        
        // Créer la table avec PDO
        $pdo = new \PDO('sqlite:' . $databasePath);
        $pdo->setAttribute(\PDO::ATTR_ERRMODE, \PDO::ERRMODE_EXCEPTION);
        
        // Créer la table categories
        $sql = "CREATE TABLE IF NOT EXISTS categories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id TEXT NOT NULL,
            name TEXT NOT NULL,
            color TEXT NOT NULL,
            created_at TEXT,
            updated_at TEXT
        )";
        
        $pdo->exec($sql);
        
        // Créer la table todos
        $sql = "CREATE TABLE IF NOT EXISTS todos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id TEXT NOT NULL,
            category_id INTEGER DEFAULT NULL,
            text TEXT NOT NULL,
            pseudo TEXT NOT NULL,
            completed INTEGER DEFAULT 0,
            assigned_to TEXT DEFAULT NULL,
            created_at TEXT,
            updated_at TEXT
        )";
        
        $pdo->exec($sql);
        
        // Ajouter la colonne assigned_to si elle n'existe pas
        try {
            $pdo->exec("ALTER TABLE todos ADD COLUMN assigned_to TEXT DEFAULT NULL");
        } catch (\Exception $e) {
            // Colonne déjà existante
        }
        
        // Créer la table comments
        $sql = "CREATE TABLE IF NOT EXISTS comments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            todo_id INTEGER NOT NULL,
            list_id TEXT NOT NULL,
            text TEXT NOT NULL,
            pseudo TEXT NOT NULL,
            created_at TEXT,
            updated_at TEXT
        )";
        
        $pdo->exec($sql);
        
        // Créer la table lists
        $sql = "CREATE TABLE IF NOT EXISTS lists (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            created_at TEXT,
            updated_at TEXT
        )";
        
        $pdo->exec($sql);
        
        // Créer la table subscribers
        $sql = "CREATE TABLE IF NOT EXISTS subscribers (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            list_id TEXT NOT NULL,
            email TEXT NOT NULL,
            created_at TEXT,
            updated_at TEXT
        )";
        
        $pdo->exec($sql);
        
        echo "✓ Migrations completed successfully!\n";
        echo "✓ Database initialized at: $databasePath\n";
    }
}
