<?php

use Illuminate\Support\Facades\Route;

// Email verification route (web route, not API)
Route::get('/verify-email/{token}', [App\Http\Controllers\SubscriberController::class, 'verifyEmail']);

// Home route - afficher la page d'accueil (routes spécifiques en premier)
Route::get('/', [App\Http\Controllers\HomeController::class, 'index']);
Route::get('/{list}/{token}', [App\Http\Controllers\HomeController::class, 'index']);
Route::get('/{list}', [App\Http\Controllers\HomeController::class, 'index']);
