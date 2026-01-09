<?php

namespace ApexLink\WP\Database\Repositories;

/**
 * Repository for post statistics and authority scores.
 */
class StatsRepository extends BaseRepository {

	/**
	 * Constructor.
	 */
	public function __construct() {
		parent::__construct( 'stats' );
	}

	/**
	 * Update the PageRank score for a post.
	 *
	 * @param int $post_id
	 * @param float $score
	 * @return int|false
	 */
	public function update_pagerank_score( int $post_id, float $score ) {
		$table = $this->table_name;
		
		// Use INSERT ... ON DUPLICATE KEY UPDATE for efficiency
		return $this->db->query(
			$this->db->prepare(
				"INSERT INTO {$table} (post_id, pagerank_score) VALUES (%d, %f)
				ON DUPLICATE KEY UPDATE pagerank_score = %f, last_updated = CURRENT_TIMESTAMP",
				$post_id,
				$score,
				$score
			)
		);
	}

    /**
     * Get authority score for a post.
     * 
     * @param int $post_id
     * @return int
     */
    public function get_authority_score(int $post_id): int {
        $score = $this->db->get_var(
            $this->db->prepare(
                "SELECT pagerank_score FROM {$this->table_name} WHERE post_id = %d",
                $post_id
            )
        );
        
        return $score ? (int) $score : 0;
    }

    /**
     * Update link counts for a post.
     * 
     * @param int $post_id
     * @param int $inbound
     * @param int $outbound
     * @return int|false
     */
    public function update_counts(int $post_id, int $inbound, int $outbound) {
        $table = $this->table_name;
        return $this->db->query(
            $this->db->prepare(
                "INSERT INTO {$table} (post_id, inbound_count, outbound_count) VALUES (%d, %d, %d)
                ON DUPLICATE KEY UPDATE inbound_count = %d, outbound_count = %d, last_updated = CURRENT_TIMESTAMP",
                $post_id, $inbound, $outbound,
                $inbound, $outbound
            )
        );
    }
}
