<?php

namespace App\Exceptions;

use RuntimeException;

class MissingWorkerPriceException extends RuntimeException
{
    public function __construct(string $message = 'لا يمكن إصدار فاتورة لعاملة بدون سعر محدد.')
    {
        parent::__construct($message);
    }
}
