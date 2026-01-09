<?php
/**
 * Plugin Name:       WP ApexLink
 * Plugin URI:        https://wpapexlink.com
 * Description:       AI-Powered Internal Linking Engine for WordPress. Features Semantic Bridge Injection (The Ghostwriter).
 * Version:           0.1.0
 * Requires at least: 6.2
 * Requires PHP:      8.1
 * Author:            7Cubit
 * Author URI:        https://7cubit.com
 * License:           GPL v2 or later
 * Text Domain:       wp-apexlink
 * Domain Path:       /languages
 */

namespace ApexLink\WP;

if (!defined('ABSPATH')) {
	exit;
}

// Autoload composer dependencies
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
	require_once __DIR__ . '/vendor/autoload.php';
}

// Load Action Scheduler
if (file_exists(__DIR__ . '/vendor/woocommerce/action-scheduler/action-scheduler.php')) {
	require_once __DIR__ . '/vendor/woocommerce/action-scheduler/action-scheduler.php';
}

/**
 * Main Plugin Class.
 */
final class WP_ApexLink
{

	/**
	 * Plugin version.
	 */
	const VERSION = '0.1.0';

	/**
	 * Singleton instance.
	 *
	 * @var WP_ApexLink|null
	 */
	private static $instance = null;

	/**
	 * Logger instance.
	 *
	 * @var Core\Logger
	 */
	private $logger;

	/**
	 * Feature flags instance.
	 *
	 * @var Core\FeatureFlags
	 */
	private $flags;

	/**
	 * Get the instance.
	 *
	 * @return WP_ApexLink
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
		define('APEXLINK_VERSION', self::VERSION);
		define('APEXLINK_PATH', plugin_dir_path(__FILE__));
		define('APEXLINK_URL', plugin_dir_url(__FILE__));
	}

	/**
	 * Setup hooks.
	 */
	private function hooks()
	{
		add_action('plugins_loaded', [$this, 'bootstrap']);

		// Register background jobs
		add_action('apexlink_autopilot_run', [\ApexLink\WP\Jobs\AutopilotJob::class, 'run']);

		register_activation_hook(__FILE__, [Core\ActivationHook::class, 'activate']);
	}

	/**
	 * Bootstrap the core services.
	 */
	public function bootstrap()
	{
		// Logger
		$this->logger = new Core\Logger();

		// Feature Flags
		$this->flags = new Core\FeatureFlags();

		$this->init_services();
	}

	/**
	 * Initialize core services.
	 */
	public function init_services()
	{
		// Admin Page

		if (is_admin()) {
			new Admin\AdminPage();
			new Admin\MetaBox();
			new Admin\PostListHooks();
		}

		// REST API
		new Api\GraphController();

		// Indexer Engine
		new Engine\Indexer\Indexer();
		new Engine\Indexer\BatchIndexer();

		// Scheduled Jobs
		Jobs\ReportingJobs::init();
	}

	/**
	 * Get the logger.
	 *
	 * @return Core\Logger
	 */
	public function logger()
	{
		return $this->logger;
	}

	/**
	 * Get the feature flags.
	 *
	 * @return Core\FeatureFlags
	 */
	public function flags()
	{
		return $this->flags;
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
function wp_apexlink()
{
	return WP_ApexLink::instance();
}

wp_apexlink();
