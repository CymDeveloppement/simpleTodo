<?php
// API routes
$router->get('/api', function () use ($router) {
    return ['message' => 'SimpleTodo API'];
});

$router->get('/api/todos/{listId}', 'App\Http\Controllers\TodoController@index');
$router->post('/api/todos/{listId}', 'App\Http\Controllers\TodoController@store');
$router->put('/api/todos/{listId}/{id}', 'App\Http\Controllers\TodoController@update');
$router->post('/api/todos/{listId}/{id}/assign', 'App\Http\Controllers\TodoController@assign');
$router->delete('/api/todos/{listId}/{id}', 'App\Http\Controllers\TodoController@destroy');
$router->delete('/api/todos/{listId}', 'App\Http\Controllers\TodoController@clearCompleted');

// Comment routes
$router->get('/api/comments/{listId}/{todoId}', 'App\Http\Controllers\CommentController@index');
$router->post('/api/comments/{listId}/{todoId}', 'App\Http\Controllers\CommentController@store');
$router->delete('/api/comments/{listId}/{todoId}/{id}', 'App\Http\Controllers\CommentController@destroy');

// List routes
$router->get('/api/lists/{listId}', 'App\Http\Controllers\ListController@show');
$router->post('/api/lists/{listId}', 'App\Http\Controllers\ListController@store');
$router->put('/api/lists/{listId}', 'App\Http\Controllers\ListController@update');
$router->delete('/api/lists/{listId}', 'App\Http\Controllers\ListController@destroy');

// Subscriber routes
$router->get('/api/subscribers/{listId}', 'App\Http\Controllers\SubscriberController@getAll');
$router->post('/api/subscribers/{listId}', 'App\Http\Controllers\SubscriberController@subscribe');
$router->delete('/api/subscribers/{listId}', 'App\Http\Controllers\SubscriberController@unsubscribe');
$router->post('/api/subscribers/{listId}/check', 'App\Http\Controllers\SubscriberController@check');
$router->get('/verify-email/{token}', 'App\Http\Controllers\SubscriberController@verifyEmail');
$router->post('/api/subscribers/{listId}/{subscriberId}/resend', 'App\Http\Controllers\SubscriberController@resendInvitation');
$router->get('/api/mylists', 'App\Http\Controllers\SubscriberController@getMyLists');
$router->get('/api/auth/token/{token}', 'App\Http\Controllers\SubscriberController@authenticateWithToken');
$router->post('/api/auth/request-email', 'App\Http\Controllers\SubscriberController@requestAuthEmail');

// Invitation routes
$router->post('/api/invitations/{listId}', 'App\Http\Controllers\InvitationController@send');

// Category routes
$router->get('/api/categories/{listId}', 'App\Http\Controllers\CategoryController@index');
$router->post('/api/categories/{listId}', 'App\Http\Controllers\CategoryController@store');
$router->put('/api/categories/{listId}/{id}', 'App\Http\Controllers\CategoryController@update');
$router->delete('/api/categories/{listId}/{id}', 'App\Http\Controllers\CategoryController@destroy');

// Email queue routes
$router->post('/api/email-queue/process', 'App\Http\Controllers\EmailQueueController@process');
$router->get('/api/email-queue/status', 'App\Http\Controllers\EmailQueueController@getQueueStatus');

// Maintenance / Update
$router->post('/api/update', 'App\Http\Controllers\UpdateController@run');


// Home route - afficher la page d'accueil (routes spécifiques en premier)
$router->get('/', 'App\Http\Controllers\HomeController@index');
$router->get('/{list}/{token}', 'App\Http\Controllers\HomeController@index');
$router->get('/{list}', 'App\Http\Controllers\HomeController@index');