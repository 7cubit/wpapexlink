<?php

namespace NeuroLink\WP\Database;

/**
 * Manage custom database tables.
 */
class SchemaManager {

	/**
	 * Schema version.
	 */
	const VERSION = '1.0.0';

	/**
	 * Get table names.
	 *
	 * @return array
	 */
	public static function get_tables() {
		global $wpdb;

		return [
			'index' => $wpdb->prefix . 'neurolink_index',
			'links' => $wpdb->prefix . 'neurolink_links',
			'stats' => $wpdb->prefix . 'neurolink_stats',
		];
	}

	/**
	 * Create or update tables.
	 */
	public static function update_schema() {
		require_once ABSPATH . 'wp-admin/includes/upgrade.php';

		$tables = self::get_tables();
		$charset_collate = self::get_charset_collate();

		// Index Table
		$sql_index = "CREATE TABLE {$tables['index']} (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			post_id bigint(20) NOT NULL,
			stemmed_content longtext NOT NULL,
			content_hash varchar(64) NOT NULL,
			indexed_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY post_id (post_id),
			KEY content_hash (content_hash),
			FULLTEXT KEY content_search (stemmed_content)
		) $charset_collate ENGINE=InnoDB;";

		// Links Table
		$sql_links = "CREATE TABLE {$tables['links']} (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			source_id bigint(20) NOT NULL,
			target_id bigint(20) NOT NULL,
			anchor text NOT NULL,
			link_type varchar(50) DEFAULT 'semantic' NOT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY source_target (source_id, target_id),
			KEY link_type (link_type)
		) $charset_collate ENGINE=InnoDB;";

		// Stats Table
		$sql_stats = "CREATE TABLE {$tables['stats']} (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			post_id bigint(20) NOT NULL,
			pagerank_score decimal(10,8) DEFAULT 0.00000000 NOT NULL,
			inbound_count int(11) DEFAULT 0 NOT NULL,
			outbound_count int(11) DEFAULT 0 NOT NULL,
			last_updated datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			UNIQUE KEY post_id (post_id)
		) $charset_collate ENGINE=InnoDB;";

		dbDelta( $sql_index );
		dbDelta( $sql_links );
		dbDelta( $sql_stats );

		update_option( 'wp_neurolink_db_version', self::VERSION );
	}

	/**
	 * Get charset collate.
	 *
	 * @return string
	 */
	private static function get_charset_collate() {
		global $wpdb;
		$charset_collate = '';

		if ( ! empty( $wpdb->charset ) ) {
			$charset_collate = "DEFAULT CHARACTER SET {$wpdb->charset}";
		}

		if ( ! empty( $wpdb->collate ) ) {
			$charset_collate .= " COLLATE {$wpdb->collate}";
		}

		return $charset_collate;
	}

	/**
	 * Drop all tables.
	 */
	public static function drop_tables() {
		global $wpdb;

		$tables = self::get_tables();
		foreach ( $tables as $table ) {
			$wpdb->query( "DROP TABLE IF EXISTS {$table}" );
		}

		delete_option( 'wp_neurolink_db_version' );
	}
}
