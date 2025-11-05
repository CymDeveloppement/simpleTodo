<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up()
    {
        Schema::create('email_queue', function (Blueprint $table) {
            $table->id();
            $table->string('type'); // 'new_todo', 'completed_todo', 'welcome', 'invitation'
            $table->string('recipient_email');
            $table->string('subject');
            $table->text('body');
            $table->enum('status', ['pending', 'sent', 'failed'])->default('pending');
            $table->timestamp('scheduled_at')->nullable();
            $table->timestamp('sent_at')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamps();
        });
    }

    public function down()
    {
        Schema::dropIfExists('email_queue');
    }
};

