<?php

namespace App\Exceptions;

use RuntimeException;

class ReservationAuthorizationException extends RuntimeException
{
    public function __construct(string $message = 'تعذّر تنفيذ عملية التفويض.')
    {
        parent::__construct($message);
    }
}
