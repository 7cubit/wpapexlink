<?php

namespace ApexLink\WP\Jobs;

use ApexLink\WP\Engine\Autopilot\AutopilotEngine;

/**
 * Background job for running Autopilot.
 */
class AutopilotJob {

    /**
     * Hook name for Action Scheduler.
     */
    const HOOK = 'apexlink_autopilot_run';

    /**
     * Dispatch the job.
     */
    public static function dispatch($options = []) {
        if (!function_exists('as_enqueue_async_action')) {
            return false;
        }

        return as_enqueue_async_action(
            self::HOOK,
            ['options' => $options],
            'apexlink'
        );
    }

    /**
     * Handle the background action.
     */
    public static function run($options = []) {
        $engine = new AutopilotEngine();
        return $engine->run($options);
    }
}
