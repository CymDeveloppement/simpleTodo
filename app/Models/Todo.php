<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Todo extends Model
{
    protected $table = 'todos';
    public $timestamps = true;
    
    protected $fillable = [
        'list_id',
        'category_id',
        'text',
        'pseudo',
        'completed',
        'assigned_to',
        'due_date',
    ];

    protected $casts = [
        'completed' => 'boolean',
        'due_date' => 'date',
    ];
}
