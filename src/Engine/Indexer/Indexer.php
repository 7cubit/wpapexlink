<?php

namespace NeuroLink\WP\Engine\Indexer;

use NeuroLink\WP\Database\Repositories\IndexRepository;
use NeuroLink\WP\Engine\Analysis\ContentParser;

/**
 * Handle content indexing orchestration.
 */
class Indexer {

	/**
	 * Repository instance.
	 *
	 * @var IndexRepository
	 */
	private $repository;

	/**
	 * Parser instance.
	 *
	 * @var ContentParser
	 */
	private $parser;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->repository = new IndexRepository();
		$this->parser     = new ContentParser();
		
		$this->hooks();
	}

	/**
	 * Register hooks.
	 */
	private function hooks() {
		add_action( 'save_post', [ $this, 'on_save_post' ], 10, 3 );
		add_action( 'wp_neurolink_index_post', [ $this, 'index_post' ] );
	}

	/**
	 * Handle post save.
	 *
	 * @param int $post_id
	 * @param \WP_Post $post
	 * @param bool $update
	 */
	public function on_save_post( $post_id, $post, $update ) {
		// Ignore revisions or autosaves
		if ( wp_is_post_revision( $post_id ) || wp_is_post_autosave( $post_id ) ) {
			return;
		}

		// Only index public post types
		if ( ! is_post_type_viewable( $post->post_type ) ) {
			return;
		}

		// Draft -> Publish or Publish update
		if ( 'publish' !== $post->post_status ) {
			// If it was published and now draft, maybe remove from index?
			// For now, let's just skip non-published.
			return;
		}

		// Dispatch background job
		if ( function_exists( 'as_enqueue_async_action' ) ) {
			as_enqueue_async_action( 'wp_neurolink_index_post', [ 'post_id' => $post_id ], 'neurolink' );
		} else {
			// Fallback to real-time if AS is not available (not recommended)
			$this->index_post( $post_id );
		}
	}

	/**
	 * Index a specific post.
	 *
	 * @param int $post_id
	 */
	public function index_post( int $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post ) {
			return;
		}

		$cleaned_text = $this->parser->parse( $post );
		$hash         = hash( 'sha256', $cleaned_text );

		$this->repository->upsert( [
			'post_id'         => $post_id,
			'stemmed_content' => $cleaned_text,
			'content_hash'    => $hash,
			'indexed_at'      => current_time( 'mysql' ),
		] );
	}
}
