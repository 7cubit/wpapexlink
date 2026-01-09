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

namespace NeuroLink\WP;

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
	 * Plugin version.
	 */
	const VERSION = '0.1.0';

	/**
	 * Singleton instance.
	 *
	 * @var WP_NeuroLink|null
	 */
	private static $instance = null;

	/**
	 * Get the instance.
	 *
	 * @return WP_NeuroLink
	 */
	public static function instance()
	{
		if (is_null(self::$instance)) {
			self::$instance = new self();
		}
		return self::$instance;
	}

	/**
	 * Constructor.
	 */
	private function __construct()
	{
		$this->define_constants();
		$this->hooks();
	}

	/**
	 * Define constants.
	 */
	private function define_constants()
	{
		define('WP_NEUROLINK_PATH', plugin_dir_path(__FILE__));
		define('WP_NEUROLINK_URL', plugin_dir_url(__FILE__));
	}

	/**
	 * Setup hooks.
	 */
	private function hooks()
	{
		add_action('plugins_loaded', [$this, 'bootstrap']);

		register_activation_hook(__FILE__, [Core\ActivationHook::class, 'activate']);
	}

	/**
	 * Bootstrap the core services.
	 */
	public function bootstrap()
	{
		// Logger
		/** @var Core\Logger $logger */
		$this->logger = new Core\Logger();

		// Feature Flags
		/** @var Core\FeatureFlags $flags */
		$this->flags = new Core\FeatureFlags();

		// Admin Page
		if (is_admin()) {
			new Admin\AdminPage();
		}

		// Indexer Engine
		new Engine\Indexer\Indexer();
	}

	/**
	 * Prevent cloning.
	 */
	private function __clone()
	{
	}

	/**
	 * Prevent unserializing.
	 */
	public function __wakeup()
	{
	}
}

/**
 * Initialize the plugin.
 */
function wp_neurolink()
{
	return WP_NeuroLink::instance();
}

wp_neurolink();
