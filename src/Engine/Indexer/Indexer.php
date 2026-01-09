<?php

namespace ApexLink\WP\Engine\Indexer;

use ApexLink\WP\Database\Repositories\IndexRepository;
use ApexLink\WP\Database\Repositories\LinkRepository;
use ApexLink\WP\Engine\Analysis\ContentParser;
use ApexLink\WP\Engine\Analysis\SemanticAnalyzer;
use ApexLink\WP\Engine\Analysis\LinkExtractor;

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
	 * Analyzer instance.
	 *
	 * @var SemanticAnalyzer
	 */
	private $analyzer;

	/**
	 * Link extractor instance.
	 *
	 * @var LinkExtractor
	 */
	private $link_extractor;

	/**
	 * Link repository instance.
	 *
	 * @var LinkRepository
	 */
	private $link_repository;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->repository = new IndexRepository();
		$this->link_repository = new LinkRepository();
		$this->parser = new ContentParser();
		$this->analyzer = new SemanticAnalyzer();
		$this->link_extractor = new LinkExtractor();
		
		$this->hooks();
	}

	/**
	 * Register hooks.
	 */
	private function hooks() {
		add_action( 'save_post', [ $this, 'on_save_post' ], 10, 3 );
		add_action('wp_apexlink_index_post', [$this, 'index_post']);
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
			as_enqueue_async_action('wp_apexlink_index_post', ['post_id' => $post_id], 'apexlink');
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
		$token_data = $this->analyzer->analyze($cleaned_text);
		// BUG FIX: Extract links from the merged/cleaned content, not just raw post_content
		$links = $this->link_extractor->extract($cleaned_text);
		$hash         = hash( 'sha256', $cleaned_text );

		\ApexLink\WP\wp_apexlink()->logger()->info(sprintf('Indexing post %d. Content length: %d, Tokens: %d, Links: %d', $post_id, strlen($cleaned_text), count($token_data), count($links)));

		// Update Semantic Index
		$this->repository->upsert( [
			'post_id'         => $post_id,
			'stemmed_content' => $cleaned_text,
			'token_data' => wp_json_encode($token_data),
			'content_hash'    => $hash,
			'indexed_at'      => current_time( 'mysql' ),
		] );

		// Update Link Graph
		$this->link_repository->save_links($post_id, $links);
	}
}
