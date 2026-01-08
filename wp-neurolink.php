<?php
/**
 * Plugin Name:       WP NeuroLink
 * Plugin URI:        https://wp-neurolink.io
 * Description:       The Neural Architecture Engine for WordPress. Features Semantic Bridge Injection (The Ghostwriter).
 * Version:           0.1.0
 * Requires at least: 6.2
 * Requires PHP:      8.1
 * Author:            WP NeuroLink Team
 * Author URI:        https://wp-neurolink.io
 * License:           GPL v2 or later
 * Text Domain:       wp-neurolink
 * Domain Path:       /languages
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// Autoload composer dependencies
if ( file_exists( __DIR__ . '/vendor/autoload.php' ) ) {
	require_once __DIR__ . '/vendor/autoload.php';
}

/**
 * Main instance of WP NeuroLink.
 */
final class WP_NeuroLink {

	/**
	 * Version constant.
	 */
	const VERSION = '0.1.0';

	/**
	 * Initialize the plugin.
	 */
	public static function init() {
		// Bootstrap Core
		self::bootstrap();
	}

	/**
	 * Bootstrap the core components.
	 */
	private static function bootstrap() {
		// Initialization logic will go here in following phases
	}
}

add_action( 'plugins_loaded', [ 'WP_NeuroLink', 'init' ] );
