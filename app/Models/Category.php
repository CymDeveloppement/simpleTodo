<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Support\Carbon;

class Category extends Model
{
    protected $table = 'categories';
    public $timestamps = true;
    
    protected $fillable = [
        'list_id',
        'name',
        'color',
    ];

    protected $appends = ['next_date'];

    public function todos(): HasMany
    {
        return $this->hasMany(Todo::class);
    }

    public function getNextDateAttribute(): ?string
    {
        $todo = $this->todos()
            ->where('completed', false)
            ->whereNotNull('due_date')
            ->orderBy('due_date', 'asc')
            ->first();

        if (!$todo || !$todo->due_date) {
            return null;
        }

        return $todo->due_date instanceof Carbon
            ? $todo->due_date->toDateString()
            : (string) $todo->due_date;
    }
}
