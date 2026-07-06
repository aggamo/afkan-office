<?php

namespace App\Exceptions;

use RuntimeException;

class WorkerNotAvailableException extends RuntimeException
{
    public function __construct(string $message = 'هذه العاملة غير متاحة للحجز حالياً.')
    {
        parent::__construct($message);
    }
}
