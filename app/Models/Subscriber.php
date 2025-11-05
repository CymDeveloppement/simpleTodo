<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Subscriber extends Model
{
    protected $table = 'subscribers';
    public $timestamps = true;
    
    protected $fillable = [
        'list_id',
        'email',
        'pseudo',
        'token',
        'email_verified',
    ];
}
