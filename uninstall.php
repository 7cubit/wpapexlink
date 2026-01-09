<?php
/**
 * WP NeuroLink Uninstall.
 *
 * @package ApexLink\WP
 */

if ( ! defined( 'WP_UNINSTALL_PLUGIN' ) ) {
	exit;
}

require_once __DIR__ . '/vendor/autoload.php';

use ApexLink\WP\Database\SchemaManager;

/**
 * Drop custom tables during uninstallation.
 */
SchemaManager::drop_tables();

// Clear any other artifacts if necessary (e.g. logs)
$upload_dir = wp_upload_dir();
$log_dir    = $upload_dir['basedir'] . '/neurolink-logs';

if ( file_exists( $log_dir ) ) {
	// Simple cleanup: delete files inside, then directory
	foreach ( glob( $log_dir . '/*' ) as $file ) {
		if ( is_file( $file ) ) {
			unlink( $file );
		}
	}
	rmdir( $log_dir );
}
