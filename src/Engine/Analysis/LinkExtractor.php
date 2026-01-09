<?php

namespace ApexLink\WP\Engine\Analysis;

/**
 * Extract links and relationship data from post content.
 */
class LinkExtractor
{

    /**
     * Extract URLs and anchor text from content.
     *
     * @param string $html The cleaned HTML content.
     * @return array List of extracted link data.
     */
    public function extract(string $html): array
    {
        if (empty($html)) {
            return [];
        }

        $html5 = new \Masterminds\HTML5();
        $dom = $html5->loadHTML($html);
        $links = [];

        foreach ($dom->getElementsByTagName('a') as $node) {
            if (!$node instanceof \DOMElement) {
                continue;
            }
            $href = $node->getAttribute('href');
            if (empty($href) || str_starts_with($href, '#') || str_starts_with($href, 'javascript:')) {
                continue;
            }

            $anchor = trim($node->textContent);
            $url = $this->normalize_url($href);
            $rel = $node->getAttribute('rel');

            if ($this->should_ignore_url($url)) {
                continue;
            }

            $links[] = [
                'url' => $url,
                'anchor' => $anchor,
                'rel' => $rel,
                'internal' => $this->is_internal($url),
            ];
        }

        /**
         * Filter the extracted links.
         *
         * @param array $links Extracted links list.
         */
        return apply_filters('apexlink_extracted_links', $links);
    }

    /**
     * Check if a URL should be ignored.
     *
     * @param string $url
     * @return bool
     */
    private function should_ignore_url(string $url): bool
    {
        $ignored = apply_filters('apexlink_ignore_urls', []);

        foreach ($ignored as $pattern) {
            if (str_contains($url, $pattern)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Determine if a URL is internal to the current site.
     *
     * @param string $url The normalized URL.
     * @return bool True if internal.
     */
    public function is_internal(string $url): bool
    {
        $home_url = get_home_url();

        // Handle relative URLs
        if (str_starts_with($url, '/')) {
            return true;
        }

        // Handle absolute URLs
        return str_starts_with($url, $home_url);
    }

    /**
     * Normalize URLs (handle relative paths).
     *
     * @param string $url
     * @return string
     */
    private function normalize_url(string $url): string
    {
        $url = trim($url);

        // If it's relative, keep as is for internal check but could expand to full URL if needed
        return $url;
    }
}
