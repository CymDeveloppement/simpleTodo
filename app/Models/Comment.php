<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Comment extends Model
{
    protected $table = 'comments';
    public $timestamps = true;
    
    protected $fillable = [
        'todo_id',
        'list_id',
        'text',
        'pseudo',
    ];
}
