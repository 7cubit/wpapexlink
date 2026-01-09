<?php

namespace ApexLink\WP\Engine\Writer;

defined('ABSPATH') || exit;

use DOMDocument;
use DOMXPath;
use DOMText;
use WP_Post;

/**
 * Safely inserts links into post content.
 */
class LinkInserter
{
    /**
     * Insert a link into a post's content.
     *
     * @param int    $post_id   The post to modify.
     * @param string $anchor    The text to turn into a link.
     * @param string $url       The URL to link to.
     * @param bool   $dry_run   If true, return the modified content without saving.
     * @return array Result with 'success', 'message', and optionally 'content'.
     */
    public function insert(int $post_id, string $anchor, string $url, bool $dry_run = false): array
    {
        $post = get_post($post_id);
        if (!$post instanceof WP_Post) {
            return ['success' => false, 'message' => 'Post not found.'];
        }

        $content = $post->post_content;

        // Check if the anchor text exists in the content
        if (stripos($content, $anchor) === false) {
            return ['success' => false, 'message' => 'Anchor text not found in post content.'];
        }

        // Parse the content as HTML
        $modified_content = $this->insert_link_into_html($content, $anchor, $url);

        if ($modified_content === $content) {
            return ['success' => false, 'message' => 'Could not insert link (anchor may be inside existing link or complex HTML).'];
        }

        if ($dry_run) {
            return [
                'success' => true,
                'message' => 'Dry run successful.',
                'content' => $modified_content,
            ];
        }

        // Save the post (creates a revision automatically)
        $result = wp_update_post([
            'ID' => $post_id,
            'post_content' => $modified_content,
        ], true);

        if (is_wp_error($result)) {
            return ['success' => false, 'message' => $result->get_error_message()];
        }

        return ['success' => true, 'message' => 'Link inserted successfully.'];
    }

    /**
     * Insert an AI-generated bridge paragraph into a post.
     *
     * @param int    $post_id
     * @param string $bridge_html The HTML paragraph to insert.
     * @param bool   $dry_run
     * @return array
     */
    public function insert_bridge(int $post_id, string $bridge_html, bool $dry_run = false): array
    {
        $post = get_post($post_id);
        if (!$post instanceof WP_Post) {
            return ['success' => false, 'message' => 'Post not found.'];
        }

        $content = $post->post_content;

        // Append the bridge at the end of the content for now
        // Advanced: Find the best insertion point
        $modified_content = $content . "\n\n" . $bridge_html;

        if ($dry_run) {
            return [
                'success' => true,
                'message' => 'Dry run successful.',
                'content' => $modified_content,
            ];
        }

        $result = wp_update_post([
            'ID' => $post_id,
            'post_content' => $modified_content,
        ], true);

        if (is_wp_error($result)) {
            return ['success' => false, 'message' => $result->get_error_message()];
        }

        return ['success' => true, 'message' => 'AI Bridge inserted successfully.'];
    }

    /**
     * Insert a link into HTML content safely.
     *
     * @param string $html   The HTML content.
     * @param string $anchor The anchor text to link.
     * @param string $url    The target URL.
     * @return string Modified HTML.
     */
    private function insert_link_into_html(string $html, string $anchor, string $url): string
    {
        // Wrap in a container to preserve structure
        $wrapped_html = '<div id="apexlink-root">' . $html . '</div>';

        $dom = new DOMDocument();
        libxml_use_internal_errors(true);
        $dom->loadHTML(
            '<?xml encoding="UTF-8">' . $wrapped_html,
            LIBXML_HTML_NOIMPLIED | LIBXML_HTML_NODEFDTD
        );
        libxml_clear_errors();

        $xpath = new DOMXPath($dom);

        // Find all text nodes that are NOT inside an <a> tag
        $text_nodes = $xpath->query('//text()[not(ancestor::a)]');

        $replaced = false;

        foreach ($text_nodes as $text_node) {
            if (!$text_node instanceof DOMText) {
                continue;
            }

            $text = $text_node->nodeValue;
            $pos = stripos($text, $anchor);

            if ($pos === false) {
                continue;
            }

            // Found the anchor text - split and insert link
            $before = substr($text, 0, $pos);
            $match = substr($text, $pos, strlen($anchor));
            $after = substr($text, $pos + strlen($anchor));

            // Create new nodes
            $parent = $text_node->parentNode;

            // Before text
            if ($before !== '') {
                $before_node = $dom->createTextNode($before);
                $parent->insertBefore($before_node, $text_node);
            }

            // The link
            $link = $dom->createElement('a');
            $link->setAttribute('href', esc_url($url));
            $link->setAttribute('data-apexlink', 'auto');
            $link->setAttribute('title', $match);
            $link->nodeValue = $match;
            $parent->insertBefore($link, $text_node);

            // After text
            if ($after !== '') {
                $after_node = $dom->createTextNode($after);
                $parent->insertBefore($after_node, $text_node);
            }

            // Remove the original text node
            $parent->removeChild($text_node);

            $replaced = true;
            break; // Only replace the first occurrence
        }

        if (!$replaced) {
            return $html;
        }

        // Extract the modified content
        $root = $dom->getElementById('apexlink-root');
        if (!$root) {
            return $html;
        }

        $inner_html = '';
        foreach ($root->childNodes as $child) {
            $inner_html .= $dom->saveHTML($child);
        }

        return $inner_html;
    }

    /**
     * Undo the last link insertion by reverting to a previous revision.
     *
     * @param int $post_id The post ID.
     * @return array Result with 'success' and 'message'.
     */
    public function undo(int $post_id): array
    {
        $revisions = wp_get_post_revisions($post_id, ['numberposts' => 2]);

        if (count($revisions) < 2) {
            return ['success' => false, 'message' => 'No previous revision available.'];
        }

        $previous = array_values($revisions)[1];

        $result = wp_update_post([
            'ID' => $post_id,
            'post_content' => $previous->post_content,
        ], true);

        if (is_wp_error($result)) {
            return ['success' => false, 'message' => $result->get_error_message()];
        }

        return ['success' => true, 'message' => 'Reverted to previous revision.'];
    }

    /**
     * Remove all ApexLink auto-inserted links from a post.
     *
     * @param int $post_id The post ID.
     * @return array Result with 'success' and 'message'.
     */
    public function remove_all_auto_links(int $post_id): array
    {
        $post = get_post($post_id);
        if (!$post instanceof WP_Post) {
            return ['success' => false, 'message' => 'Post not found.'];
        }

        $content = $post->post_content;

        // Remove links with data-apexlink="auto" and keep the anchor text
        $pattern = '/<a[^>]*data-apexlink="auto"[^>]*>([^<]+)<\/a>/i';
        $cleaned = preg_replace($pattern, '$1', $content);

        if ($cleaned === $content) {
            return ['success' => false, 'message' => 'No auto-inserted links found.'];
        }

        wp_update_post([
            'ID' => $post_id,
            'post_content' => $cleaned,
        ]);

        return ['success' => true, 'message' => 'Removed all ApexLink auto-inserted links.'];
    }
}
