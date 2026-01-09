<?php

namespace ApexLink\WP\Database\Repositories;

/**
 * Repository for Autopilot Logs and Batch management.
 */
class AutopilotRepository extends BaseRepository {

    public function __construct() {
        parent::__construct('autopilot_logs');
    }

    /**
     * Log an insertion.
     */
    public function log_insertion($batch_id, $source_id, $target_id, $anchor) {
        return $this->db->insert($this->table_name, [
            'batch_id' => $batch_id,
            'source_id' => $source_id,
            'target_id' => $target_id,
            'anchor' => $anchor,
            'action' => 'inserted'
        ]);
    }

    /**
     * Get the last batch ID.
     */
    public function get_last_batch_id() {
        return $this->db->get_var("SELECT batch_id FROM {$this->table_name} ORDER BY created_at DESC LIMIT 1");
    }

    /**
     * Get all logs for a batch.
     */
    public function get_batch_logs($batch_id) {
        return $this->db->get_results(
            $this->db->prepare("SELECT * FROM {$this->table_name} WHERE batch_id = %s", $batch_id)
        );
    }
}
