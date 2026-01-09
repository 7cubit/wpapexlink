<?php

namespace ApexLink\WP\Engine\Recommendation;

use ApexLink\WP\Database\Repositories\IndexRepository;
use ApexLink\WP\Database\Repositories\LinkRepository;

/**
 * Service to find candidate internal links using semantic search.
 */
class CandidateFinder
{

    private IndexRepository $index_repository;
    private LinkRepository $link_repository;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->index_repository = new IndexRepository();
        $this->link_repository = new LinkRepository();
    }

    /**
     * Find candidate links for a given post.
     *
     * @param int $post_id
     * @param int $limit
     * @return SuggestionDTO[]
     */
    public function find_for_post(int $post_id, int $limit = 10): array
    {
        $post = get_post($post_id);
        if (!$post) {
            return [];
        }

        // 1. Get existing links to exclude
        $existing_links = $this->link_repository->get_links_for_post($post_id);
        $exclude_ids = array_filter(array_map(fn($l) => $l->target_id, $existing_links));
        $exclude_ids[] = $post_id;

        // 2. Perform Full-Text search
        $ai_rerank = get_option('apexlink_enable_ai_reranking', false);
        $search_limit = $ai_rerank ? 20 : $limit * 2;

        $query = $post->post_title;
        $results = $this->run_semantic_search($query, $exclude_ids, $search_limit);

        // 3. Apply scoring
        $suggestions = $this->apply_scoring($results, $post_id);

        // 4. AI Reranking if enabled
        if ($ai_rerank && !empty($suggestions)) {
            $suggestions = $this->rerank_with_ai($suggestions, $post);
        }

        return array_slice($suggestions, 0, $limit);
    }

    /**
     * Rerank suggestions using Cloudflare AI Worker.
     *
     * @param SuggestionDTO[] $suggestions
     * @param \WP_Post        $source_post
     * @return SuggestionDTO[]
     */
    private function rerank_with_ai(array $suggestions, $source_post): array
    {
        $license_manager = new \ApexLink\WP\License\LicenseManager();
        $license_data = $license_manager->get_license_data();

        if (!$license_data || empty($license_data['key'])) {
            return $suggestions;
        }

        $source_context = $this->get_source_context($source_post->post_content, $source_post->post_title);
        $candidates = array_map(fn($s) => $s->title, $suggestions);

        $headers = ['Content-Type' => 'application/json'];

        // 5. Check for Custom Key (Agency BYOK)
        if (get_option('apexlink_use_custom_key', false)) {
            $custom_key_encrypted = get_option('apexlink_openai_key');
            if ($custom_key_encrypted) {
                $headers['X-Custom-Key'] = $this->decrypt_key($custom_key_encrypted);
            }
        }

        $response = wp_remote_post('https://apexlink-cloud.7cubit.workers.dev/ai/rerank', [
            'body' => json_encode([
                'license_key' => $license_data['key'],
                'source_context' => $source_context,
                'candidates' => $candidates,
            ]),
            'headers' => $headers,
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            return $suggestions;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        if (empty($body['success']) || empty($body['scores'])) {
            return $suggestions;
        }

        // Merge scores
        foreach ($suggestions as $i => $suggestion) {
            if (isset($body['scores'][$i])) {
                $ai_score = (float) $body['scores'][$i]; // 0-10
                $suggestion->ai_score = $ai_score;

                // Weighting: Local Score (Keyword/Silo) + AI Score (Semantic)
                // Normalize AI score to 0-10 scale if it isn't already, then blend.
                // For now, let's say AI score heavily influences the rank.
                $suggestion->score = ($suggestion->score * 0.3) + ($ai_score * 7.0);
                $suggestion->reasons[] = 'AI Reranked (Confidence: ' . ($ai_score * 10) . '%)';
            }
        }

        // Re-sort
        usort($suggestions, fn($a, $b) => $b->score <=> $a->score);

        return $suggestions;
    }

    /**
     * Get a representative context string from the post.
     */
    private function get_source_context(string $content, string $title): string
    {
        $text = strip_tags($content);
        $text = preg_replace('/\s+/', ' ', $text);

        // Take the first 300 characters as context
        return $title . ': ' . substr($text, 0, 300);
    }

    /**
     * Run the raw SQL MATCH() AGAINST() query.
     *
     * @param string $query
     * @param array  $exclude_ids
     * @param int    $limit
     * @return array
     */
    private function run_semantic_search(string $query, array $exclude_ids, int $limit): array
    {
        global $wpdb;
        $index_table = $this->index_repository->get_table_name();
        $posts_table = $wpdb->posts;

        $exclude_sql = !empty($exclude_ids) ? "AND p.ID NOT IN (" . implode(',', array_map('intval', $exclude_ids)) . ")" : "";

        // Full-text search on Title and Stemmed Content
        // We weight title match higher by selecting it twice in the MATCH() or similar logic
        // But here we rely on the natural score and then adjust in PHP
        $sql = $wpdb->prepare(
            "SELECT p.ID, p.post_title, 
					MATCH(i.stemmed_content) AGAINST (%s) as relevance_score
			 FROM {$posts_table} p
			 JOIN {$index_table} i ON p.ID = i.post_id
			 WHERE p.post_status = 'publish' 
			   AND p.post_type = 'post'
			   {$exclude_sql}
			   AND MATCH(i.stemmed_content) AGAINST (%s)
			   AND i.stemmed_content != ''
			 ORDER BY relevance_score DESC
			 LIMIT %d",
            $query,
            $query,
            $limit
        );

        return $wpdb->get_results($sql) ?: [];
    }

    /**
     * Compute final scores based on business logic.
     *
     * @param array $results
     * @param int   $source_id
     * @return SuggestionDTO[]
     */
    private function apply_scoring(array $results, int $source_id): array
    {
        $suggestions = [];
        $source_categories = (array) wp_get_post_categories($source_id);

        foreach ($results as $row) {
            $score = (float) $row->relevance_score;
            $reasons = ['Semantic Match'];

            // Silo Boost: Same Category
            $target_categories = (array) wp_get_post_categories($row->ID);
            $common = array_intersect($source_categories, $target_categories);

            if (!empty($common)) {
                $score *= 1.25; // 25% boost for same silo
                $reasons[] = 'Silo Boost (Same Category)';
            }

            if ($this->is_stop_word($row->post_title)) {
                $score *= 0.5; // Heavy penalty for generic stop-word anchors
                $reasons[] = 'Anchor Warning: Generic/Stop-word';
            }

            // GSC Boost: Striking Distance Opportunity
            $gsc_manager = new \ApexLink\WP\Integrations\Google\GSCManager();
            $gsc_opportunities = $gsc_manager->get_striking_distance_opportunities();

            foreach ($gsc_opportunities as $op) {
                // If this post is a target for a striking distance keyword
                if (trailingslashit($op['page']) === trailingslashit(get_permalink($row->ID))) {
                    $score *= 1.5; // 50% boost for GSC opportunities
                    $reasons[] = 'GSC Opportunity Boost (Striking Distance)';
                    break;
                }
            }

            // Diversity Check: Over-Optimized Anchors
            $density = $this->link_repository->get_anchor_density($row->ID);
            foreach ($density as $d) {
                if ($d->anchor === $row->post_title && $d->count > 5) {
                    $score *= 0.8; // 20% penalty if this exact anchor is already used > 5 times
                    $reasons[] = 'Diversity Warning: Anchor used > 5 times';
                }
            }

            $dto = new SuggestionDTO(
                (int) $row->ID,
                $row->post_title,
                $score,
                $reasons,
                get_permalink($row->ID)
            );
            $suggestions[] = $dto;
        }

        // Check for bridge candidates: High relevance but no anchor text in content
        $source_post = get_post($source_id);
        $content = $source_post->post_content;

        foreach ($suggestions as $dto) {
            $has_anchor = stripos($content, $dto->title) !== false;

            if (!$has_anchor) {
                $dto->is_bridge = true;
                $dto->reasons[] = 'Bridge Candidate (No Anchor Text found)';
            }
        }

        // Re-sort by final score
        usort($suggestions, fn($a, $b) => $b->score <=> $a->score);

        return $suggestions;
    }

    /**
     * Check if a string is a generic stop-word anchor.
     */
    private function is_stop_word(string $text): bool
    {
        $stop_words = [
            'click here',
            'read more',
            'learn more',
            'this post',
            'check this out',
            'go here',
            'website',
            'link',
            'view more',
            'continue reading',
            'more info'
        ];

        $text = strtolower(trim($text));
        return in_array($text, $stop_words);
    }

    /**
     * Find candidate inbound links TO a given post (The Magnet).
     *
     * @param int $post_id The target post ID
     * @param int $limit
     * @return SuggestionDTO[]
     */
    public function find_inbound_for_post(int $post_id, int $limit = 10): array
    {
        $target_post = get_post($post_id);
        if (!$target_post) {
            return [];
        }

        global $wpdb;
        $index_table = $this->index_repository->get_table_name();
        $posts_table = $wpdb->posts;
        $stats_table = $wpdb->prefix . 'apexlink_stats';

        // 1. Get existing sources to exclude
        $existing_links = $this->link_repository->get_links_for_post($post_id, 'inbound');
        $exclude_ids = array_filter(array_map(fn($l) => $l->source_id, $existing_links));
        $exclude_ids[] = $post_id;

        $exclude_sql = !empty($exclude_ids) ? "AND p.ID NOT IN (" . implode(',', array_map('intval', $exclude_ids)) . ")" : "";

        // 2. Search index for content CONTAINING target title
        // We join with stats to get PageRank for sorting
        $query = $target_post->post_title;
        $sql = $wpdb->prepare(
            "SELECT p.ID, p.post_title, 
                    MATCH(i.stemmed_content) AGAINST (%s) as relevance_score,
                    s.pagerank_score
             FROM {$posts_table} p
             JOIN {$index_table} i ON p.ID = i.post_id
             LEFT JOIN {$stats_table} s ON p.ID = s.post_id
             WHERE p.post_status = 'publish' 
               AND p.post_type = 'post'
               {$exclude_sql}
               AND MATCH(i.stemmed_content) AGAINST (%s)
             ORDER BY s.pagerank_score DESC, relevance_score DESC
             LIMIT %d",
            $query,
            $query,
            $limit * 2
        );

        $results = $wpdb->get_results($sql) ?: [];
        $suggestions = [];

        foreach ($results as $row) {
            $score = ((float) $row->relevance_score * 0.5) + ((float) ($row->pagerank_score ?? 0) * 0.5);
            $reasons = [
                'Source Authority: ' . round($row->pagerank_score ?? 0, 1),
                'Contextual Keyword Match'
            ];

            $dto = new SuggestionDTO(
                (int) $row->ID,
                $row->post_title,
                $score,
                $reasons,
                get_permalink($row->ID)
            );

            // For inbound links, the "candidate" is the source that will be edited.
            // We'll tag this as an inbound type if needed, but for now DTO is generic.
            $suggestions[] = $dto;
        }

        return array_slice($suggestions, 0, $limit);
    }

    /**
     * Decrypt a key using openssl.
     */
    private function decrypt_key($data): string
    {
        if (!$data)
            return '';
        $method = 'aes-256-cbc';
        $encryption_key = defined('AUTH_KEY') ? AUTH_KEY : 'apexlink-fallback-salt';
        $parts = explode('::', base64_decode($data), 2);
        if (count($parts) !== 2)
            return '';
        list($encrypted_data, $iv) = $parts;
        return (string) openssl_decrypt($encrypted_data, $method, $encryption_key, 0, $iv);
    }
}
