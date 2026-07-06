<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | يسمح هذا الإعداد لواجهة الموقع (Next.js) بالاتصال بواجهة الـ API.
    | في الإنتاج نحصر المصادر المسموحة في نطاق الواجهة فقط عبر FRONTEND_URL.
    | المصادقة تتم بـ Bearer token وليس بالكوكيز، لذا supports_credentials = false.
    |
    */

    'paths' => ['api/*'],

    'allowed_methods' => ['*'],

    'allowed_origins' => array_filter([
        env('FRONTEND_URL', 'http://localhost:3000'),
    ]),

    'allowed_origins_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
