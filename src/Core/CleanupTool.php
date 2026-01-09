<?php

namespace ApexLink\WP\Core;

/**
 * Handle database cleanup and transient garbage collection.
 */
class CleanupTool {

	/**
	 * Run all cleanup tasks.
	 */
	public static function run() {
		self::cleanup_transients();
		self::cleanup_logs();
	}

	/**
	 * Delete expired ApexLink transients.
	 */
	private static function cleanup_transients() {
		global $wpdb;

		// WordPress usually cleans transients on access, but we force clean our own
		// to ensure they don't bloat the options table if cron is disabled.
		$sql = "DELETE FROM $wpdb->options WHERE option_name LIKE '_transient_timeout_apexlink_%' AND option_value < " . time();
		$wpdb->query($sql);

		$sql = "DELETE FROM $wpdb->options WHERE option_name LIKE '_transient_apexlink_%' AND option_name NOT IN (SELECT CONCAT('_transient_', SUBSTRING(option_name, 20)) FROM $wpdb->options WHERE option_name LIKE '_transient_timeout_apexlink_%')";
		$wpdb->query($sql);
	}

	/**
	 * Cleanup old autopilot logs (keep last 30 days).
	 */
	private static function cleanup_logs() {
		global $wpdb;
		$table = $wpdb->prefix . 'apexlink_autopilot_logs';
		
		// If table doesn't exist yet, skip
		if ($wpdb->get_var("SHOW TABLES LIKE '$table'") !== $table) {
			return;
		}

		$wpdb->query("DELETE FROM $table WHERE created_at < DATE_SUB(NOW(), INTERVAL 30 DAY)");
	}
}
