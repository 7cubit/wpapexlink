<?php

namespace NeuroLink\WP\Database\Repositories;

/**
 * Repository for Semantic Index.
 */
class IndexRepository extends BaseRepository {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'index' );
	}

	/**
	 * Upsert index record.
	 *
	 * @param array $data
	 * @return int|false
	 */
	public function upsert( array $data ) {
		$existing = $this->db->get_var(
			$this->db->prepare(
				"SELECT id FROM {$this->table_name} WHERE post_id = %d",
				$data['post_id']
			)
		);

		if ( $existing ) {
			return $this->db->update(
				$this->table_name,
				$data,
				[ 'id' => $existing ]
			);
		}

		return $this->db->insert( $this->table_name, $data );
	}

	/**
	 * Search content using FULLTEXT.
	 *
	 * @param string $query
	 * @param int $limit
	 * @return array
	 */
	public function search( string $query, int $limit = 10 ) {
		return $this->db->get_results(
			$this->db->prepare(
				"SELECT *, MATCH(stemmed_content) AGAINST(%s IN NATURAL LANGUAGE MODE) as relevance 
				 FROM {$this->table_name} 
				 WHERE MATCH(stemmed_content) AGAINST(%s IN NATURAL LANGUAGE MODE) 
				 ORDER BY relevance DESC 
				 LIMIT %d",
				$query,
				$query,
				$limit
			)
		);
	}
}
