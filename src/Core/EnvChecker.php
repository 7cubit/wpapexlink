<?php

namespace ApexLink\WP\Core;

/**
 * Handle environment-specific checks for background processing.
 */
class EnvChecker {

	/**
	 * Check if the site's cron system is functional.
	 *
	 * @return bool
	 */
	public static function check_loopback() {
		$response = wp_remote_get( get_home_url(), [
			'timeout'     => 5,
			'redirection' => 0,
			'user-agent'  => 'ApexLink Loopback Check',
		] );

		if ( is_wp_error( $response ) ) {
			return false;
		}

		return 200 === wp_remote_retrieve_response_code( $response );
	}

	/**
	 * Get recommendations for background processing based on env.
	 */
	public static function get_cron_recommendation() {
		if ( defined( 'DISABLE_WP_CRON' ) && DISABLE_WP_CRON ) {
			return 'Manual System Cron required (crontab).';
		}

		if ( ! self::check_loopback() ) {
			return 'Loopback request failed. Action Scheduler might be sluggish.';
		}

		return 'WP Cron is active and loopback is functional.';
	}
}
