<?php

namespace ApexLink\WP\Admin;

use ApexLink\WP\Database\Repositories\StatsRepository;

/**
 * Handle custom columns in the WordPress Post List.
 */
class PostListHooks {

	/**
	 * Repository instance.
	 *
	 * @var StatsRepository
	 */
	private $stats_repository;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->stats_repository = new StatsRepository();
		$this->register_hooks();
	}

	/**
	 * Register hooks.
	 */
	private function register_hooks() {
		add_filter( 'manage_post_posts_columns', [ $this, 'add_authority_column' ] );
		add_action( 'manage_post_posts_custom_column', [ $this, 'render_authority_column' ], 10, 2 );
		add_filter( 'manage_edit-post_sortable_columns', [ $this, 'make_authority_sortable' ] );
	}

	/**
	 * Add the Authority column to the post list.
	 *
	 * @param array $columns
	 * @return array
	 */
	public function add_authority_column( $columns ) {
		$columns['apexlink_authority'] = __( 'Authority', 'wp-apexlink' );
		return $columns;
	}

	/**
	 * Render the Authority column content.
	 *
	 * @param string $column
	 * @param int $post_id
	 */
	public function render_authority_column( $column, $post_id ) {
		if ( 'apexlink_authority' !== $column ) {
			return;
		}

		$score = $this->stats_repository->get_authority_score( $post_id );
		
		$color_class = 'text-gray-400';
		if ($score > 70) {
			$color_class = 'text-green-600 font-bold';
		} elseif ($score > 40) {
			$color_class = 'text-blue-600';
		}

		printf(
			'<span class="apexlink-authority-badge %s" title="%s">%d</span>',
			esc_attr($color_class),
			__('Internal PageRank Authority Score', 'wp-apexlink'),
			(int) $score
		);
	}

	/**
	 * Make the column sortable.
	 *
	 * @param array $columns
	 * @return array
	 */
	public function make_authority_sortable( $columns ) {
		$columns['apexlink_authority'] = 'apexlink_authority';
		return $columns;
	}
}
