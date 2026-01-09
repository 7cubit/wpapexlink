<?php

namespace NeuroLink\WP\Core;

/**
 * Handle plugin activation.
 */
class ActivationHook {

	/**
	 * Activate the plugin.
	 */
	public static function activate() {
		self::check_php_version();
		self::check_dependencies();
		self::setup_initial_db();
		
		flush_rewrite_rules();
	}

	/**
	 * Check PHP version.
	 */
	private static function check_php_version() {
		if ( version_compare( PHP_VERSION, '8.1', '<' ) ) {
			wp_die(
				esc_html__( 'WP NeuroLink requires PHP 8.1 or higher. Please upgrade your PHP version.', 'wp-neurolink' ),
				esc_html__( 'Plugin Activation Error', 'wp-neurolink' ),
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
				esc_html__( 'WP NeuroLink requires the DOM extension. Please enable it in your PHP configuration.', 'wp-neurolink' ),
				esc_html__( 'Plugin Activation Error', 'wp-neurolink' ),
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
}
