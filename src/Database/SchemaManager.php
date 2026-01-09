<?php

namespace ApexLink\WP\Database;

/**
 * Manage custom database tables.
 */
class SchemaManager {

	/**
	 * Schema version.
	 */
	const VERSION = '1.7.0';

	/**
	 * Get table names.
	 *
	 * @return array
	 */
	public static function get_tables() {
		global $wpdb;

		return [
			'index' => $wpdb->prefix . 'apexlink_index',
			'links' => $wpdb->prefix . 'apexlink_links',
			'stats' => $wpdb->prefix . 'apexlink_stats',
			'suggestions' => $wpdb->prefix . 'apexlink_suggestions',
			'autopilot_rules' => $wpdb->prefix . 'apexlink_autopilot_rules',
			'autopilot_logs' => $wpdb->prefix . 'apexlink_autopilot_logs',
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
			token_data longtext NOT NULL,
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
			url text NOT NULL,
			link_type varchar(50) DEFAULT 'internal' NOT NULL,
			is_nofollow tinyint(1) DEFAULT 0 NOT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY source_target (source_id, target_id),
			KEY link_type (link_type),
			KEY source_type (source_id, link_type),
			KEY target_type (target_id, link_type)
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
			UNIQUE KEY post_id (post_id),
			KEY pagerank (pagerank_score)
		) $charset_collate ENGINE=InnoDB;";

		// Suggestions Table
		$sql_suggestions = "CREATE TABLE {$tables['suggestions']} (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			source_id bigint(20) NOT NULL,
			target_id bigint(20) NOT NULL,
			anchor text NOT NULL,
			context text NOT NULL,
			score decimal(5,2) DEFAULT 0.00 NOT NULL,
			status varchar(20) DEFAULT 'pending' NOT NULL,
			suggestion_type varchar(50) DEFAULT 'ai' NOT NULL,
			is_bridge tinyint(1) DEFAULT 0 NOT NULL,
			generated_bridge text DEFAULT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY source_target (source_id, target_id),
			KEY status (status),
			KEY suggestion_type (suggestion_type)
		) $charset_collate ENGINE=InnoDB;";

		// Autopilot Rules Table
		$sql_autopilot_rules = "CREATE TABLE {$tables['autopilot_rules']} (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			keyword varchar(255) NOT NULL,
			target_id bigint(20) NOT NULL,
			match_type varchar(50) DEFAULT 'exact' NOT NULL,
			status varchar(20) DEFAULT 'active' NOT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY status (status)
		) $charset_collate ENGINE=InnoDB;";

		// Autopilot Logs Table
		$sql_autopilot_logs = "CREATE TABLE {$tables['autopilot_logs']} (
			id bigint(20) NOT NULL AUTO_INCREMENT,
			batch_id varchar(64) NOT NULL,
			source_id bigint(20) NOT NULL,
			target_id bigint(20) NOT NULL,
			anchor text NOT NULL,
			action varchar(20) DEFAULT 'inserted' NOT NULL,
			created_at datetime DEFAULT CURRENT_TIMESTAMP NOT NULL,
			PRIMARY KEY  (id),
			KEY batch_id (batch_id),
			KEY source_id (source_id)
		) $charset_collate ENGINE=InnoDB;";

		dbDelta( $sql_index );
		dbDelta( $sql_links );
		dbDelta( $sql_stats );
		dbDelta($sql_suggestions);
		dbDelta($sql_autopilot_rules);
		dbDelta($sql_autopilot_logs);

		update_option('wp_apexlink_db_version', self::VERSION);
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

		delete_option('wp_apexlink_db_version');
	}
}
