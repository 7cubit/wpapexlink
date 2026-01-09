<?php

namespace ApexLink\WP\Database\Repositories;

/**
 * Repository for link suggestions.
 */
class SuggestionRepository extends BaseRepository
{

	/**
	 * Constructor.
	 */
	public function __construct()
	{
		parent::__construct('suggestions');
	}

	/**
	 * Get pending suggestions with post details.
	 *
	 * @param array $args Filter arguments.
	 * @return array
	 */
	public function get_suggestions(array $args = [])
	{
		global $wpdb;
		$posts_table = $wpdb->posts;

		$status = $args['status'] ?? 'pending';
		$type = $args['type'] ?? 'ai';
		$limit = $args['limit'] ?? 50;
		$offset = $args['offset'] ?? 0;

		$sql = "SELECT s.*, 
                       p1.post_title as source_title, 
                       p1.post_type as source_type,
                       p2.post_title as target_title,
                       p2.post_type as target_type
                FROM {$this->table_name} s
                JOIN {$wpdb->posts} p1 ON s.source_id = p1.ID
                JOIN {$wpdb->posts} p2 ON s.target_id = p2.ID
                WHERE s.status = %s AND s.suggestion_type = %s
                ORDER BY s.score DESC, s.created_at DESC
                LIMIT %d OFFSET %d";

		return $wpdb->get_results(
			$wpdb->prepare($sql, $status, $type, $limit, $offset)
		);
	}

	/**
	 * Update suggestion status.
	 *
	 * @param int $id
	 * @param string $status
	 * @return int|false
	 */
	public function update_status(int $id, string $status)
	{
		return $this->db->update(
			$this->table_name,
			['status' => $status],
			['id' => $id]
		);
	}

	/**
	 * Bulk update status.
	 *
	 * @param array $ids
	 * @param string $status
	 * @return int|false
	 */
	public function bulk_update_status(array $ids, string $status)
	{
		if (empty($ids)) {
			return 0;
		}

		$ids_placeholder = implode(',', array_fill(0, count($ids), '%d'));
		$sql = "UPDATE {$this->table_name} SET status = %s WHERE id IN ($ids_placeholder)";

		return $this->db->query(
			$this->db->prepare($sql, array_merge([$status], $ids))
		);
	}

	/**
	 * Count total suggestions.
	 *
	 * @param string $status
	 * @return int
	 */
	public function count(string $status = 'pending')
	{
		return (int) $this->db->get_var(
			$this->db->prepare("SELECT COUNT(*) FROM {$this->table_name} WHERE status = %s", $status)
		);
	}

	/**
	 * Save a single suggestion.
	 *
	 * @param array $data
	 * @return int|false
	 */
	public function add_suggestion(array $data)
	{
		return $this->db->insert($this->table_name, [
			'source_id' => $data['source_id'],
			'target_id' => $data['target_id'],
			'anchor' => $data['anchor'],
			'context' => $data['context'],
			'score' => $data['score'] ?? 0,
			'status' => 'pending',
		]);
	}

	/**
	 * Update suggestion status by source and target ID.
	 *
	 * @param int $source_id
	 * @param int $target_id
	 * @param string $status
	 * @return int|false
	 */
	public function update_status_by_target(int $source_id, int $target_id, string $status)
	{
		return $this->db->update(
			$this->table_name,
			['status' => $status],
			['source_id' => $source_id, 'target_id' => $target_id]
		);
	}

	/**
	 * Get a specific suggestion by source and target.
	 */
	public function get_suggestion(int $source_id, int $target_id)
	{
		return $this->db->get_row(
			$this->db->prepare(
				"SELECT * FROM {$this->table_name} WHERE source_id = %d AND target_id = %d",
				$source_id,
				$target_id
			)
		);
	}
}
