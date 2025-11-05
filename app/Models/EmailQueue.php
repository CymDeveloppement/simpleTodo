<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class EmailQueue extends Model
{
    protected $table = 'email_queue';
    public $timestamps = true;
    
    protected $fillable = [
        'type',
        'recipient_email',
        'subject',
        'body',
        'status',
        'scheduled_at',
        'sent_at',
        'error_message',
    ];
    
    protected $casts = [
        'scheduled_at' => 'datetime',
        'sent_at' => 'datetime',
    ];
}

