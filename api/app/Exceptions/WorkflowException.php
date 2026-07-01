<?php

namespace App\Exceptions;

use RuntimeException;

class WorkflowException extends RuntimeException
{
    public function __construct(string $message = 'تعذّر تنفيذ عملية سير العمل.')
    {
        parent::__construct($message);
    }
}
