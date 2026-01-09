<?php

namespace ApexLink\WP\Engine\Analysis;

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

		// 1. Elementor
		if ( $this->is_elementor_post( $post->ID ) ) {
			$elementor_content = $this->get_elementor_content($post->ID);
			if (!empty($elementor_content)) {
				$content .= "\n" . $elementor_content;
			}
		}

		// 2. ACF Fields (Text and WYSIWYG)
		if (function_exists('get_field_objects')) {
			$fields = get_field_objects($post->ID);
			if ($fields) {
				foreach ($fields as $field) {
					if (in_array($field['type'], ['text', 'textarea', 'wysiwyg'])) {
						if (!empty($field['value'])) {
							$content .= "\n" . (is_array($field['value']) ? implode(' ', $field['value']) : $field['value']);
						}
					}
				}
			}
		}

		// 3. WooCommerce
		if ('product' === $post->post_type) {
			$product = wc_get_product($post->ID);
			if ($product) {
				$content .= "\n" . $product->get_short_description();
			}
		}

		// 4. Bricks Builder
		if ('bricks' === get_post_meta($post->ID, '_bricks_editor_mode', true)) {
			$bricks_data = get_post_meta($post->ID, '_bricks_page_content_2', true);
			if ($bricks_data) {
				$content .= "\n" . $this->parse_bricks_data($bricks_data);
			}
		}

		// 5. Oxygen Builder
		$oxygen_json = get_post_meta($post->ID, 'ct_builder_json', true);
		if (!empty($oxygen_json)) {
			$content .= "\n" . $this->parse_json_builder_data($oxygen_json);
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
		// Custom handling for builders that use specific shortcode tags
		return strip_shortcodes( $text );
	}

	/**
	 * Strip noise (scripts, styles, etc.).
	 *
	 * @param string $content
	 * @return string
	 */
	public function strip_noise( string $content ) {
		if (empty(trim($content))) {
			return '';
		}

		// Load HTML safely
		$dom = @$this->html->loadHTML('<body>' . $content . '</body>');

		// 1. Remove specific tags
		foreach ( $this->excluded_tags as $tag ) {
			$nodes = $dom->getElementsByTagName( $tag );
			$to_remove = [];
			foreach ($nodes as $node) {
				$to_remove[] = $node;
			}
			foreach ($to_remove as $node) {
				if ($node->parentNode)
					$node->parentNode->removeChild($node);
			}
		}

		// 2. Remove ignored classes
		$ignored_classes = get_option('apexlink_ignore_classes', '');
		if (!empty($ignored_classes)) {
			$classes = array_map('trim', explode(',', $ignored_classes));
			$xpath = new \DOMXPath($dom);
			foreach ($classes as $class) {
				if (empty($class))
					continue;
				$nodes = $xpath->query("//*[contains(concat(' ', normalize-space(@class), ' '), ' $class ')]");
				foreach ($nodes as $node) {
					if ($node->parentNode)
						$node->parentNode->removeChild($node);
				}
			}
		}

		$body = $dom->getElementsByTagName('body')->item(0);
		return $body ? $dom->saveHTML($body) : '';
	}

	/**
	 * Extract raw text.
	 *
	 * @param string $html
	 * @return string
	 */
	public function extract_text( string $html ) {
		$text = function_exists('wp_strip_all_tags') ? wp_strip_all_tags($html) : strip_tags($html);
		
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
	 */
	private function get_elementor_content( int $post_id ) {
		if (!class_exists('\Elementor\Plugin'))
			return '';
		// standard elementor content
		return \Elementor\Plugin::$instance->frontend->get_builder_content_for_display( $post_id );
	}

	/**
	 * Check if post is Divi.
	 */
	private function is_divi_post( int $post_id ) {
		return 'on' === get_post_meta( $post_id, '_et_pb_use_builder', true );
	}

	/**
	 * Parse JSON from Oxygen/etc.
	 */
	private function parse_json_builder_data($json)
	{
		if (is_string($json)) {
			$json = json_decode($json, true);
		}
		if (!is_array($json))
			return '';

		$text = '';
		array_walk_recursive($json, function ($value, $key) use (&$text) {
			if (in_array($key, ['text', 'content', 'title', 'heading']) && is_string($value)) {
				$text .= ' ' . $value;
			}
		});

		return $text;
	}

	/**
	 * Parse Bricks data.
	 */
	private function parse_bricks_data($data)
	{
		if (!is_array($data))
			return '';

		$text = '';
		foreach ($data as $element) {
			if (!empty($element['settings']['text']))
				$text .= ' ' . $element['settings']['text'];
			if (!empty($element['settings']['title']))
				$text .= ' ' . $element['settings']['title'];
			if (!empty($element['children']))
				$text .= ' ' . $this->parse_bricks_data($element['children']);
		}
		return $text;
	}
}
