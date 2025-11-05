<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('lists', function (Blueprint $table) {
            $table->string('id')->primary();
            $table->string('title');
            $table->string('header_gradient')->default('gradient1');
            $table->string('creator_email')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('lists');
    }
};

