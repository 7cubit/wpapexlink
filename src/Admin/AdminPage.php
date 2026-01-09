<?php

namespace NeuroLink\WP\Admin;

/**
 * Handle Admin Dashboard UI.
 */
class AdminPage {

	/**
	 * Initialize the admin page.
	 */
	public function __construct() {
		add_action( 'admin_menu', [ $this, 'register_menu' ] );
		add_action( 'admin_enqueue_scripts', [ $this, 'enqueue_assets' ] );
	}

	/**
	 * Register the menu page.
	 */
	public function register_menu() {
		add_menu_page(
			__( 'WP NeuroLink', 'wp-neurolink' ),
			__( 'NeuroLink', 'wp-neurolink' ),
			'manage_options',
			'wp-neurolink',
			[ $this, 'render_page' ],
			'dashicons-brain',
			30
		);
	}

	/**
	 * Render the page shell.
	 */
	public function render_page() {
		echo '<div id="wp-neurolink-admin-root" class="wp-neurolink-admin"></div>';
	}

	/**
	 * Enqueue assets.
	 *
	 * @param string $hook
	 */
	public function enqueue_assets( $hook ) {
		if ( 'toplevel_page_wp-neurolink' !== $hook ) {
			return;
		}

		$asset_file = WP_NEUROLINK_PATH . 'build/index.asset.php';

		if ( ! file_exists( $asset_file ) ) {
			return;
		}

		$assets = require $asset_file;

		wp_enqueue_script(
			'wp-neurolink-admin',
			WP_NEUROLINK_URL . 'build/index.js',
			$assets['dependencies'],
			$assets['version'],
			true
		);

		wp_enqueue_style(
			'wp-neurolink-admin',
			WP_NEUROLINK_URL . 'build/index.css',
			[],
			$assets['version']
		);

		wp_localize_script( 'wp-neurolink-admin', 'wpNeuroLinkData', [
			'apiUrl' => rest_url( 'wp-neurolink/v1' ),
			'nonce'  => wp_create_nonce( 'wp_rest' ),
            'systemStatus' => [
                'dbVersion' => get_option('wp_neurolink_db_version', '0.0.0'),
                'phpVersion' => PHP_VERSION,
                'tables' => \NeuroLink\WP\Database\SchemaManager::get_tables(),
            ]
		] );
	}
}
