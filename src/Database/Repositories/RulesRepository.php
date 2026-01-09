<?php

namespace ApexLink\WP\Database\Repositories;

/**
 * Repository for Autopilot Rules.
 */
class RulesRepository {

    /**
     * Get table name.
     */
    public function get_table_name() {
        global $wpdb;
        return $wpdb->prefix . 'apexlink_autopilot_rules';
    }

    /**
     * Get all active rules.
     */
    public function get_active_rules() {
        global $wpdb;
        $table = $this->get_table_name();
        return $wpdb->get_results("SELECT * FROM {$table} WHERE status = 'active'");
    }

    /**
     * Create a new rule.
     */
    public function create_rule($data) {
        global $wpdb;
        $table = $this->get_table_name();
        return $wpdb->insert($table, [
            'keyword' => $data['keyword'],
            'target_id' => $data['target_id'],
            'match_type' => $data['match_type'] ?? 'exact',
            'status' => $data['status'] ?? 'active'
        ]);
    }

    /**
     * Delete a rule.
     */
    public function delete_rule($id) {
        global $wpdb;
        $table = $this->get_table_name();
        return $wpdb->delete($table, ['id' => $id]);
    }

    /**
     * Toggle rule status.
     */
    public function update_status($id, $status) {
        global $wpdb;
        $table = $this->get_table_name();
        return $wpdb->update($table, ['status' => $status], ['id' => $id]);
    }
}
