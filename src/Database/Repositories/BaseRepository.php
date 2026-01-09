<?php

namespace NeuroLink\WP\Database\Repositories;

/**
 * Base Repository class.
 */
abstract class BaseRepository {

	/**
	 * Database instance.
	 *
	 * @var \wpdb
	 */
	protected $db;

	/**
	 * Table name.
	 *
	 * @var string
	 */
	protected $table_name;

	/**
	 * Constructor.
	 *
	 * @param string $table_key The key from SchemaManager::get_tables().
	 */
	public function __construct( string $table_key ) {
		global $wpdb;
		$this->db = $wpdb;

		$tables = \NeuroLink\WP\Database\SchemaManager::get_tables();
		$this->table_name = $tables[ $table_key ] ?? '';
	}

	/**
	 * Find a record by ID.
	 *
	 * @param int $id
	 * @return object|null
	 */
	public function find( int $id ) {
		return $this->db->get_row(
			$this->db->prepare(
				"SELECT * FROM {$this->table_name} WHERE id = %d",
				$id
			)
		);
	}

	/**
	 * Delete a record by ID.
	 *
	 * @param int $id
	 * @return int|false
	 */
	public function delete( int $id ) {
		return $this->db->delete( $this->table_name, [ 'id' => $id ], [ '%d' ] );
	}
}
