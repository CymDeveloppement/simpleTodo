<?php

use Illuminate\Database\Migrations\Migration;

return new class extends Migration
{
    public function up()
    {
        $db = \DB::connection()->getPdo();
        
        // Vérifier si la colonne existe déjà
        $stmt = $db->query("PRAGMA table_info(lists)");
        $columns = $stmt->fetchAll(\PDO::FETCH_ASSOC);
        $columnExists = false;
        
        foreach ($columns as $column) {
            if ($column['name'] === 'auto_assign_to_creator') {
                $columnExists = true;
                break;
            }
        }
        
        if (!$columnExists) {
            $db->exec("ALTER TABLE lists ADD COLUMN auto_assign_to_creator INTEGER DEFAULT 0");
        }
    }

    public function down()
    {
        $db = \DB::connection()->getPdo();
        $db->exec("ALTER TABLE lists DROP COLUMN auto_assign_to_creator");
    }
};

