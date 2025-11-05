<?php

return [
    'default' => env('MAIL_MAILER', 'smtp'),
    
    'mailers' => [
        'smtp' => [
            'transport' => 'smtp',
            'host' => env('MAIL_HOST', 'smtp.mailgun.org'),
            'port' => env('MAIL_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username' => env('MAIL_USERNAME'),
            'password' => env('MAIL_PASSWORD'),
            'timeout' => null,
        ],
        
        'ses' => [
            'transport' => 'ses',
        ],
        
        'mailgun' => [
            'transport' => 'smtp',
            'host' => env('MAILGUN_SMTP_HOST', 'smtp.mailgun.org'),
            'port' => env('MAILGUN_SMTP_PORT', 587),
            'encryption' => env('MAIL_ENCRYPTION', 'tls'),
            'username' => env('MAILGUN_SMTP_USERNAME'),
            'password' => env('MAILGUN_SMTP_PASSWORD'),
            'timeout' => null,
        ],
        
        'sendmail' => [
            'transport' => 'sendmail',
            'path' => '/usr/sbin/sendmail -bs',
        ],
        
        'log' => [
            'transport' => 'log',
            'channel' => env('MAIL_LOG_CHANNEL'),
        ],
    ],
    
    'from' => [
        'address' => env('MAIL_FROM_ADDRESS', 'noreply@simpletodo.local'),
        'name' => env('MAIL_FROM_NAME', 'SimpleTodo'),
    ],
    
    'markdown' => [
        'theme' => 'default',
        'paths' => [
            resource_path('views/vendor/mail'),
        ],
    ],
];

