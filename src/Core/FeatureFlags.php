<?php

namespace ApexLink\WP\Core;

/**
 * Feature Flag system.
 */
class FeatureFlags {

	/**
	 * Check if a feature is enabled.
	 *
	 * @param string $feature
	 * @return bool
	 */
	public static function is_enabled( string $feature ) : bool {
		$flags = self::get_flags();
		return isset( $flags[ $feature ] ) && $flags[ $feature ];
	}

	/**
	 * Get all flags.
	 *
	 * @return array
	 */
	private static function get_flags() : array {
		static $flags = null;

		if ( is_null( $flags ) ) {
			$flags = [
				'ai_analysis'    => defined( 'APEXLINK_AI_ENABLED' ) ? APEXLINK_AI_ENABLED : false,
				'semantic_bridge' => defined( 'WP_DEBUG' ) ? WP_DEBUG : false,
				'graph_viz'       => true, // Default enabled
			];

			// Allow filtering
			$flags = apply_filters( 'wp_apexlink_feature_flags', $flags );
		}

		return $flags;
	}
}
