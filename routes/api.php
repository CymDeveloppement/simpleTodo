<?php

use Illuminate\Support\Facades\Route;

// API routes
Route::get('/', function () {
    return ['message' => 'SimpleTodo API'];
});

// Todo routes
Route::get('/todos/{listId}', [App\Http\Controllers\TodoController::class, 'index']);
Route::post('/todos/{listId}', [App\Http\Controllers\TodoController::class, 'store']);
Route::put('/todos/{listId}/{id}', [App\Http\Controllers\TodoController::class, 'update']);
Route::post('/todos/{listId}/{id}/assign', [App\Http\Controllers\TodoController::class, 'assign']);
Route::delete('/todos/{listId}/{id}', [App\Http\Controllers\TodoController::class, 'destroy']);
Route::delete('/todos/{listId}', [App\Http\Controllers\TodoController::class, 'clearCompleted']);

// Comment routes
Route::get('/comments/{listId}/{todoId}', [App\Http\Controllers\CommentController::class, 'index']);
Route::post('/comments/{listId}/{todoId}', [App\Http\Controllers\CommentController::class, 'store']);
Route::delete('/comments/{listId}/{todoId}/{id}', [App\Http\Controllers\CommentController::class, 'destroy']);

// List routes
Route::get('/lists/{listId}', [App\Http\Controllers\ListController::class, 'show']);
Route::post('/lists/{listId}', [App\Http\Controllers\ListController::class, 'store']);
Route::put('/lists/{listId}', [App\Http\Controllers\ListController::class, 'update']);
Route::delete('/lists/{listId}', [App\Http\Controllers\ListController::class, 'destroy']);

// Subscriber routes
Route::get('/subscribers/{listId}', [App\Http\Controllers\SubscriberController::class, 'getAll']);
Route::post('/subscribers/{listId}', [App\Http\Controllers\SubscriberController::class, 'subscribe']);
Route::delete('/subscribers/{listId}', [App\Http\Controllers\SubscriberController::class, 'unsubscribe']);
Route::post('/subscribers/{listId}/check', [App\Http\Controllers\SubscriberController::class, 'check']);
Route::post('/subscribers/{listId}/{subscriberId}/resend', [App\Http\Controllers\SubscriberController::class, 'resendInvitation']);
Route::post('/subscribers/{listId}/todos/{todoId}/last-comment', [App\Http\Controllers\SubscriberController::class, 'updateLastViewedComment']);
Route::get('/subscribers/{listId}/todos/{todoId}/last-comment', [App\Http\Controllers\SubscriberController::class, 'getLastViewedComment']);
Route::get('/mylists', [App\Http\Controllers\SubscriberController::class, 'getMyLists']);
Route::get('/auth/token/{token}', [App\Http\Controllers\SubscriberController::class, 'authenticateWithToken']);
Route::post('/auth/request-email', [App\Http\Controllers\SubscriberController::class, 'requestAuthEmail']);

// Invitation routes
Route::post('/invitations/{listId}', [App\Http\Controllers\InvitationController::class, 'send']);

// Update route
Route::get('/update/check', [App\Http\Controllers\UpdateController::class, 'check']);

// Category routes
Route::get('/categories/{listId}', [App\Http\Controllers\CategoryController::class, 'index']);
Route::post('/categories/{listId}', [App\Http\Controllers\CategoryController::class, 'store']);
Route::put('/categories/{listId}/{id}', [App\Http\Controllers\CategoryController::class, 'update']);
Route::delete('/categories/{listId}/{id}', [App\Http\Controllers\CategoryController::class, 'destroy']);

// Email queue routes
Route::post('/email-queue/process', [App\Http\Controllers\EmailQueueController::class, 'process']);
Route::get('/email-queue/status', [App\Http\Controllers\EmailQueueController::class, 'getQueueStatus']);

// Maintenance / Update
Route::post('/update', [App\Http\Controllers\UpdateController::class, 'run']);

Route::post('/mistral/generate', [App\Http\Controllers\MistralController::class, 'generate']);

