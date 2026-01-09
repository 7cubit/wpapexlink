<?php

namespace ApexLink\WP\Database\Repositories;

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
	 * Clear all links for a specific post.
	 *
	 * @param int $post_id
	 * @return int|false
	 */
	public function clear_links(int $post_id)
	{
		wp_cache_delete("apexlink_links_{$post_id}_outbound", 'apexlink');
		wp_cache_delete("apexlink_orphan_posts", 'apexlink');
		wp_cache_delete("apexlink_broken_links_count", 'apexlink');

		return $this->db->delete(
			$this->table_name,
			['source_id' => $post_id]
		);
	}

	/**
	 * Save multiple links for a post.
	 *
	 * @param int $post_id
	 * @param array $links
	 */
	public function save_links(int $post_id, array $links)
	{
		$this->clear_links($post_id);

		foreach ($links as $link) {
			$target_id = 0;
			if ($link['internal']) {
				$target_id = url_to_postid($link['url']);
				wp_cache_delete("apexlink_links_{$target_id}_inbound", 'apexlink');
			}

			$this->db->insert($this->table_name, [
				'source_id' => $post_id,
				'target_id' => $target_id,
				'anchor' => $link['anchor'],
				'url' => $link['url'],
				'link_type' => $link['internal'] ? 'internal' : 'external',
				'is_nofollow' => (str_contains($link['rel'] ?? '', 'nofollow')) ? 1 : 0,
			]);
		}
	}

	/**
	 * Get links for a specific post.
	 *
	 * @param int $post_id
	 * @param string $direction 'outbound' or 'inbound'
	 * @return array
	 */
	public function get_links_for_post( int $post_id, string $direction = 'outbound' ) {
		$cache_key = "apexlink_links_{$post_id}_{$direction}";
		$cached = wp_cache_get($cache_key, 'apexlink');

		if (false !== $cached) {
			return $cached;
		}

		$field = 'outbound' === $direction ? 'source_id' : 'target_id';

		$results = $this->db->get_results(
			$this->db->prepare(
				"SELECT * FROM {$this->table_name} WHERE {$field} = %d",
				$post_id
			)
		);

		wp_cache_set($cache_key, $results, 'apexlink');

		return $results;
	}

	/**
	 * Get orphan posts (posts with no inbound internal links).
	 *
	 * @return array List of post IDs.
	 */
	public function get_orphan_posts()
	{
		$cached = wp_cache_get('apexlink_orphan_posts', 'apexlink');
		if (false !== $cached) {
			return $cached;
		}

		global $wpdb;
		$posts_table = $wpdb->posts;

		$sql = "SELECT p.ID FROM {$posts_table} p 
				LEFT JOIN {$this->table_name} l ON p.ID = l.target_id AND l.link_type = 'internal'
				WHERE p.post_type = 'post' AND p.post_status = 'publish'
				AND l.id IS NULL";

		$results = $wpdb->get_col($sql);
		wp_cache_set('apexlink_orphan_posts', $results, 'apexlink', 3600); // 1 hour cache

		return $results;
	}

	/**
	 * Count broken internal links.
	 * 
	 * @return int
	 */
	public function count_broken_links()
	{
		$cached = wp_cache_get('apexlink_broken_links_count', 'apexlink');
		if (false !== $cached) {
			return $cached;
		}

		global $wpdb;
		$posts_table = $wpdb->posts;

		// A link is broken if it's internal and target_id doesn't exist in posts table
		$sql = "SELECT COUNT(*) FROM {$this->table_name} l
				LEFT JOIN {$posts_table} p ON l.target_id = p.ID
				WHERE l.link_type = 'internal' 
				  AND l.target_id != 0
				  AND p.ID IS NULL";

		$count = (int) $wpdb->get_var($sql);
		wp_cache_set('apexlink_broken_links_count', $count, 'apexlink', 3600);

		return $count;
	}

	/**
	 * Get anchor text density for a post (inbound).
	 * 
	 * @param int $post_id
	 * @return array
	 */
	public function get_anchor_density(int $post_id)
	{
		global $wpdb;
		return $wpdb->get_results(
			$wpdb->prepare(
				"SELECT anchor, COUNT(*) as count 
				 FROM {$this->table_name} 
				 WHERE target_id = %d AND link_type = 'internal'
				 GROUP BY anchor 
				 ORDER BY count DESC",
				$post_id
			)
		);
	}

	/**
	 * Get global diversity statistics.
	 * 
	 * @return array
	 */
	public function get_diversity_stats()
	{
		global $wpdb;
		return $wpdb->get_results(
			"SELECT anchor, COUNT(*) as count 
			 FROM {$this->table_name} 
			 WHERE link_type = 'internal'
			 GROUP BY anchor 
			 ORDER BY count DESC 
			 LIMIT 50"
		);
	}

	/**
	 * Get link creation velocity for the last 30 days.
	 */
	public function get_link_velocity_data()
	{
		global $wpdb;
		return $wpdb->get_results(
			"SELECT DATE(created_at) as date, COUNT(*) as count 
			 FROM {$this->table_name} 
			 WHERE created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY)
			 GROUP BY DATE(created_at)
			 ORDER BY date ASC"
		);
	}

	/**
	 * Get detailed broken links report.
	 */
	public function get_broken_internal_links()
	{
		global $wpdb;
		$posts_table = $wpdb->posts;

		return $wpdb->get_results(
			"SELECT l.*, p_source.post_title as source_title 
			 FROM {$this->table_name} l
			 JOIN {$posts_table} p_source ON l.source_id = p_source.ID
			 LEFT JOIN {$posts_table} p_target ON l.target_id = p_target.ID
			 WHERE l.link_type = 'internal' 
			   AND l.target_id != 0
			   AND p_target.ID IS NULL"
		);
	}

	/**
	 * Get external domain distribution.
	 */
	public function get_external_domain_stats()
	{
		global $wpdb;
		// This requires parsing the URL to get the host. 
		// Since we store the full URL, we can do some SQL processing or PHP processing.
		// PHP processing is safer for complex URLs.
		$links = $wpdb->get_results(
			"SELECT url FROM {$this->table_name} WHERE link_type = 'external'"
		);

		$domains = [];
		foreach ($links as $link) {
			$host = parse_url($link->url, PHP_URL_HOST);
			if ($host) {
				$domains[$host] = ($domains[$host] ?? 0) + 1;
			}
		}

		arsort($domains);
		$result = [];
		foreach (array_slice($domains, 0, 20) as $domain => $count) {
			$result[] = ['domain' => $domain, 'count' => $count];
		}

		return $result;
	}

	/**
	 * Calculate click depth for all posts.
	 * 
	 * @return array [post_id => depth]
	 */
	public function calculate_click_depths()
	{
		global $wpdb;
		$homepage_id = (int) get_option('page_on_front');
		if (!$homepage_id) {
			// Fallback to latest post if no homepage set
			$homepage_id = (int) $wpdb->get_var("SELECT ID FROM {$wpdb->posts} WHERE post_type = 'post' AND post_status = 'publish' ORDER BY post_date DESC LIMIT 1");
		}

		if (!$homepage_id)
			return [];

		$depths = [$homepage_id => 0];
		$queue = [$homepage_id];
		$visited = [$homepage_id];

		while (!empty($queue)) {
			$current_id = array_shift($queue);
			$current_depth = $depths[$current_id];

			// Get all internal links from this post
			$targets = $wpdb->get_col($wpdb->prepare(
				"SELECT target_id FROM {$this->table_name} WHERE source_id = %d AND link_type = 'internal' AND target_id != 0",
				$current_id
			));

			foreach ($targets as $target_id) {
				$target_id = (int) $target_id;
				if (!in_array($target_id, $visited)) {
					$visited[] = $target_id;
					$depths[$target_id] = $current_depth + 1;
					$queue[] = $target_id;
				}
			}
		}

		return $depths;
	}
}
