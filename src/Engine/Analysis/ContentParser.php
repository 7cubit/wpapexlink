<?php

namespace NeuroLink\WP\Engine\Analysis;

use Masterminds\HTML5;

/**
 * Service for parsing WordPress content.
 */
class ContentParser {

	/**
	 * HTML5 parser instance.
	 *
	 * @var HTML5
	 */
	private $html;

	/**
	 * Tags to exclude.
	 *
	 * @var array
	 */
	private $excluded_tags = [ 'script', 'style', 'header', 'footer', 'nav', 'noscript' ];

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->html = new HTML5();
	}

	/**
	 * Parse content from a post object.
	 *
	 * @param \WP_Post $post
	 * @return string Cleaned text.
	 */
	public function parse( \WP_Post $post ) {
		$content = $post->post_content;

		// Support for Elementor
		if ( $this->is_elementor_post( $post->ID ) ) {
			$content = $this->get_elementor_content( $post->ID );
		}

		// Support for Divi
		if ( $this->is_divi_post( $post->ID ) ) {
			// Divi usually uses post_content with shortcodes
		}

		$content = $this->strip_shortcodes( $content );
		$content = $this->strip_noise( $content );

		return $this->extract_text( $content );
	}

	/**
	 * Strip shortcodes from text.
	 *
	 * @param string $text
	 * @return string
	 */
	public function strip_shortcodes( string $text ) {
		return strip_shortcodes( $text );
	}

	/**
	 * Strip noise (scripts, styles, etc.).
	 *
	 * @param string $content
	 * @return string
	 */
	public function strip_noise( string $content ) {
		if ( empty( $content ) ) {
			return '';
		}

		// Load HTML safely (surround with body to avoid fragment issues)
		$dom = $this->html->loadHTML( '<body>' . $content . '</body>' );

		foreach ( $this->excluded_tags as $tag ) {
			$nodes = $dom->getElementsByTagName( $tag );
			while ( $nodes->length > 0 ) {
				$node = $nodes->item( 0 );
				$node->parentNode->removeChild( $node );
			}
		}

		return $dom->saveHTML();
	}

	/**
	 * Extract raw text.
	 *
	 * @param string $html
	 * @return string
	 */
	public function extract_text( string $html ) {
		$text = wp_strip_all_tags( $html );
		
		// Remove multiple spaces/newlines
		$text = preg_replace( '/\s+/', ' ', $text );
		
		return trim( $text );
	}

	/**
	 * Check if post is Elementor.
	 *
	 * @param int $post_id
	 * @return bool
	 */
	private function is_elementor_post( int $post_id ) {
		return 'builder' === get_post_meta( $post_id, '_elementor_edit_mode', true );
	}

	/**
	 * Get Elementor content.
	 *
	 * @param int $post_id
	 * @return string
	 */
	private function get_elementor_content( int $post_id ) {
		if ( ! class_exists( '\Elementor\Plugin' ) ) {
			return '';
		}

		// This might trigger heavy processing, better to use raw data if possible
		// but for indexing, we want what the user sees.
		return \Elementor\Plugin::$instance->frontend->get_builder_content_for_display( $post_id );
	}

	/**
	 * Check if post is Divi.
	 *
	 * @param int $post_id
	 * @return bool
	 */
	private function is_divi_post( int $post_id ) {
		return 'on' === get_post_meta( $post_id, '_et_pb_use_builder', true );
	}
}
