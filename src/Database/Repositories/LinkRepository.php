<?php

namespace NeuroLink\WP\Database\Repositories;

/**
 * Repository for established links.
 */
class LinkRepository extends BaseRepository {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'links' );
	}

	/**
	 * Create a new link record.
	 *
	 * @param array $data
	 * @return int|false
	 */
	public function add_link( array $data ) {
		return $this->db->insert( $this->table_name, $data );
	}

	/**
	 * Get links for a specific post.
	 *
	 * @param int $post_id
	 * @param string $direction 'outbound' or 'inbound'
	 * @return array
	 */
	public function get_links_for_post( int $post_id, string $direction = 'outbound' ) {
		$field = 'outbound' === $direction ? 'source_id' : 'target_id';

		return $this->db->get_results(
			$this->db->prepare(
				"SELECT * FROM {$this->table_name} WHERE {$field} = %d",
				$post_id
			)
		);
	}
}
