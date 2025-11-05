<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::table('todos', function (Blueprint $table) {
            if (!Schema::hasColumn('todos', 'category_id')) {
                $table->unsignedBigInteger('category_id')->nullable()->after('list_id');
            }
            if (!Schema::hasColumn('todos', 'assigned_to')) {
                $table->string('assigned_to')->nullable()->after('pseudo');
            }
        });
    }

    public function down()
    {
        Schema::table('todos', function (Blueprint $table) {
            if (Schema::hasColumn('todos', 'category_id')) {
                $table->dropColumn('category_id');
            }
            if (Schema::hasColumn('todos', 'assigned_to')) {
                $table->dropColumn('assigned_to');
            }
        });
    }
};

