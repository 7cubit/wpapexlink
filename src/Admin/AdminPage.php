<?php

namespace ApexLink\WP\Admin;

/**
 * Handle Admin Dashboard UI.
 */
class AdminPage {

	/**
	 * Initialize the admin page.
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'register_menu' ] );
		add_action('network_admin_menu', [$this, 'register_menu']);
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
		add_action('enqueue_block_editor_assets', [$this, 'enqueue_block_editor_assets']);
	}

	/**
	 * Register the menu page.
	 */
	public function register_menu() {
		$slug = is_network_admin() ? 'wp-apexlink-network' : 'wp-apexlink';
		add_menu_page(
			__('WP ApexLink', 'wp-apexlink'),
			__('ApexLink', 'wp-apexlink'),
			'manage_options',
			$slug,
			[ $this, 'render_page' ],
			'data:image/svg+xml;base64,' . base64_encode('<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#4a90e2" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 1 12 4.5v15a2.5 2.5 0 0 1-4.96-.44 2.5 2.5 0 0 1-2.96-3.08 3 3 0 0 1-.34-5.58 2.5 2.5 0 0 1 1.32-4.24 2.5 2.5 0 0 1 4.44-1.66Z"/><path d="M14.5 2A2.5 2.5 0 0 0 12 4.5v15a2.5 2.5 0 0 0 4.96-.44 2.5 2.5 0 0 0 2.96-3.08 3 3 0 0 0 .34-5.58 2.5 2.5 0 0 0-1.32-4.24 2.5 2.5 0 0 0-4.44-1.66Z"/></svg>'),
			30
		);
	}

	/**
	 * Render the page shell.
	 */
	public function render_page() {
		echo '<div id="wp-apexlink-admin-root" class="wp-apexlink-admin"></div>';
	}

	/**
	 * Enqueue assets.
	 *
	 * @param string $hook
	 */
	public function enqueue_assets( $hook ) {
		if ('toplevel_page_wp-apexlink' !== $hook && 'toplevel_page_wp-apexlink-network' !== $hook) {
			return;
		}

		$this->register_neuro_assets();
	}

	/**
	 * Enqueue assets for the block editor.
	 */
	public function enqueue_block_editor_assets()
	{
		$this->register_neuro_assets();
	}

	/**
	 * Register and enqueue shared assets.
	 */
	private function register_neuro_assets()
	{
		$asset_file = APEXLINK_PATH . 'build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$assets = require $asset_file;

		wp_enqueue_script(
			'wp-apexlink-admin',
			APEXLINK_URL . 'build/index.js',
			$assets['dependencies'],
			$assets['version'],
			true
		);

		wp_enqueue_style(
			'wp-apexlink-admin',
			APEXLINK_URL . 'build/index.css',
			[],
			$assets['version']
		);

		wp_localize_script('wp-apexlink-admin', 'wpApexLinkData', [
			'apiUrl' => rest_url('apexlink/v1'),
			'nonce'  => wp_create_nonce( 'wp_rest' ),
			'postId' => get_the_ID(), // For Gutenberg context
            'systemStatus' => [
				'dbVersion' => get_option('wp_apexlink_db_version', '0.0.0'),
                'phpVersion' => PHP_VERSION,
				'tables' => \ApexLink\WP\Database\SchemaManager::get_tables(),
            ]
		] );
	}
}
