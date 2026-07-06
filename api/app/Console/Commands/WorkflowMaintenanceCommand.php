<?php

namespace App\Console\Commands;

use App\Services\RecruitmentWorkflowService;
use Illuminate\Console\Attributes\Description;
use Illuminate\Console\Attributes\Signature;
use Illuminate\Console\Command;

#[Signature('workflow:maintain')]
#[Description('Detect delayed recruitment files and announce ended warranties')]
class WorkflowMaintenanceCommand extends Command
{
    public function handle(RecruitmentWorkflowService $service): int
    {
        $result = $service->runDailyMaintenance();

        $this->info("تنبيهات التأخير: {$result['delays_notified']} | إشعارات انتهاء الضمان: {$result['warranties_closed']}");

        return self::SUCCESS;
    }
}
