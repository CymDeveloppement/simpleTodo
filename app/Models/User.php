<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Support\Facades\Auth;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Connecter un utilisateur via un token de subscriber
     * 
     * @param string $token Le token du subscriber
     * @return User|null L'utilisateur connecté ou null si le token est invalide
     */
    public static function connectWithToken(string $token): ?self
    {
        // Récupérer le subscriber via le token
        $subscriber = \App\Models\Subscriber::where('token', $token)->first();
        
        if (!$subscriber) {
            return null;
        }
        
        // Récupérer ou créer l'utilisateur
        $user = self::firstOrCreate(
            ['email' => $subscriber->email],
            [
                'name' => $subscriber->pseudo ?: explode('@', $subscriber->email)[0],
                'email_verified_at' => $subscriber->email_verified ? now() : null,
            ]
        );
        
        // Connecter l'utilisateur
        Auth::login($user);
        
        return $user;
    }
}
