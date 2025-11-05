-- Création des tables pour SimpleTodo

-- Table: todos
CREATE TABLE IF NOT EXISTS "todos" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "list_id" TEXT NOT NULL,
    "category_id" INTEGER DEFAULT NULL,
    "text" TEXT NOT NULL,
    "pseudo" TEXT NOT NULL,
    "completed" INTEGER DEFAULT 0,
    "assigned_to" TEXT DEFAULT NULL,
    "due_date" TEXT DEFAULT NULL,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Table: subscribers
CREATE TABLE IF NOT EXISTS "subscribers" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "list_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "pseudo" TEXT DEFAULT NULL,
    "token" TEXT DEFAULT NULL,
    "email_verified" INTEGER DEFAULT 0,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Table: categories
CREATE TABLE IF NOT EXISTS "categories" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "list_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Table: comments
CREATE TABLE IF NOT EXISTS "comments" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "todo_id" INTEGER NOT NULL,
    "pseudo" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Table: lists
CREATE TABLE IF NOT EXISTS "lists" (
    "id" TEXT PRIMARY KEY,
    "title" TEXT NOT NULL,
    "header_gradient" TEXT DEFAULT 'gradient1',
    "creator_email" TEXT DEFAULT NULL,
    "created_at" TEXT,
    "updated_at" TEXT
);

-- Table: email_queue
CREATE TABLE IF NOT EXISTS "email_queue" (
    "id" INTEGER PRIMARY KEY AUTOINCREMENT,
    "type" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "subject" TEXT NOT NULL,
    "body" TEXT NOT NULL,
    "status" TEXT DEFAULT 'pending',
    "scheduled_at" TEXT DEFAULT NULL,
    "sent_at" TEXT DEFAULT NULL,
    "error_message" TEXT DEFAULT NULL,
    "created_at" TEXT DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TEXT DEFAULT CURRENT_TIMESTAMP
);

