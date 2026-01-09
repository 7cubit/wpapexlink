<?php

namespace ApexLink\WP\Core;

/**
 * Handle plugin activation.
 */
class ActivationHook {

	/**
	 * Activate the plugin.
	 */
	public static function activate($network_wide)
	{
		self::check_php_version();
		self::check_dependencies();

		if (is_multisite() && $network_wide) {
			global $wpdb;
			$blog_ids = $wpdb->get_col("SELECT blog_id FROM $wpdb->blogs");
			foreach ($blog_ids as $blog_id) {
				switch_to_blog($blog_id);
				\ApexLink\WP\Database\SchemaManager::update_schema();
				restore_current_blog();
			}
		} else {
			\ApexLink\WP\Database\SchemaManager::update_schema();
			self::migrate_tables();
		}

		self::pre_load_optimal_settings();
		
		flush_rewrite_rules();
	}

	/**
	 * Pre-load optimal default settings for first-time users.
	 */
	private static function pre_load_optimal_settings()
	{
		$defaults = [
			'apexlink_silo_boost' => 'yes',
			'apexlink_anchor_diversity_mode' => 'auto',
			'apexlink_min_capability' => 'manage_options',
			'apexlink_ignore_classes' => 'wp-block-buttons,wp-block-social-links,wp-block-navigation',
		];

		foreach ($defaults as $key => $value) {
			if (get_option($key) === false) {
				update_option($key, $value);
			}
		}
	}

	/**
	 * Check PHP version.
	 */
	private static function check_php_version() {
		if ( version_compare( PHP_VERSION, '8.1', '<' ) ) {
			wp_die(
				esc_html__('WP ApexLink requires PHP 8.1 or higher. Please upgrade your PHP version.', 'wp-apexlink'),
				esc_html__('Plugin Activation Error', 'wp-apexlink'),
				[ 'back_link' => true ]
			);
		}
	}

	/**
	 * Check dependencies.
	 */
	private static function check_dependencies() {
		// Example check for a required PHP extension
		if ( ! extension_loaded( 'dom' ) ) {
			wp_die(
				esc_html__('WP ApexLink requires the DOM extension. Please enable it in your PHP configuration.', 'wp-apexlink'),
				esc_html__('Plugin Activation Error', 'wp-apexlink'),
				[ 'back_link' => true ]
			);
		}
	}

	/**
	 * Setup initial database tables.
	 */
	private static function setup_initial_db() {
		// DB Migration logic will be implemented in following phases
	}
	/**
	 * Rename old ApexLink tables to ApexLink.
	 */
	private static function migrate_tables()
	{
		global $wpdb;
		$tables = [
			'index',
			'links',
			'stats',
			'suggestions',
			'autopilot_rules',
			'autopilot_logs'
		];

		foreach ($tables as $table) {
			$old_name = $wpdb->prefix . 'apexlink_' . $table;
			$new_name = $wpdb->prefix . 'apexlink_' . $table;

			if (
				$wpdb->get_var("SHOW TABLES LIKE '$old_name'") === $old_name &&
				$wpdb->get_var("SHOW TABLES LIKE '$new_name'") !== $new_name
			) {
				$wpdb->query("RENAME TABLE $old_name TO $new_name");
			}
		}
	}
}
