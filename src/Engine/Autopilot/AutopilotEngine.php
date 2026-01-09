<?php

namespace ApexLink\WP\Engine\Autopilot;

use ApexLink\WP\Database\Repositories\RulesRepository;
use ApexLink\WP\Database\Repositories\SuggestionRepository;
use ApexLink\WP\Database\Repositories\LinkRepository;

/**
 * Orchestrates autopilot link matching and staging.
 */
class AutopilotEngine
{

    private $rules_repo;
    private $suggestion_repo;
    private $link_repo;

    public function __construct()
    {
        $this->rules_repo = new RulesRepository();
        $this->suggestion_repo = new SuggestionRepository();
        $this->link_repo = new LinkRepository();
    }

    /**
     * Run autopilot for all active rules across all posts.
     * 
     * @param array $options Constraints for the run.
     * @return int Number of staged suggestions created.
     */
    public function run($options = [])
    {
        $max_links_per_post = $options['max_links_per_post'] ?? 3;
        $min_score = $options['min_score'] ?? 0;
        $max_total_staged = $options['max_total_staged'] ?? 50;

        $rules = $this->rules_repo->get_active_rules();
        if (empty($rules)) {
            return 0;
        }

        $staged_count = 0;

        // Get all published posts
        $posts = get_posts([
            'post_type' => 'post',
            'post_status' => 'publish',
            'numberposts' => -1
        ]);

        foreach ($posts as $post) {
            if (!($post instanceof \WP_Post))
                continue;
            if ($staged_count >= $max_total_staged)
                break;

            // Check Freemium Daily Limits
            $license_manager = new \ApexLink\WP\License\LicenseManager();
            $limits = $license_manager->get_plan_limits();
            $daily_limit = $limits['daily_auto_links'];

            if ($daily_limit !== -1) {
                // Count autopilot suggestions created today
                global $wpdb;
                $today = date('Y-m-d 00:00:00');
                $count = (int) $wpdb->get_var($wpdb->prepare(
                    "SELECT COUNT(*) FROM {$wpdb->prefix}apexlink_suggestions 
                     WHERE suggestion_type = 'autopilot' AND created_at >= %s",
                    $today
                ));

                if ($count >= $daily_limit) {
                    break; // Stop processing if limit reached
                }
            }

            $content = $post->post_content;
            $source_id = $post->ID;

            // 1. Check existing auto-links in this post
            $existing_links = $this->link_repo->get_links_for_post($source_id);
            if (count($existing_links) >= $max_links_per_post) {
                continue;
            }

            foreach ($rules as $rule) {
                if ($staged_count >= $max_total_staged)
                    break;
                if ($daily_limit !== -1 && ($count + $staged_count) >= $daily_limit) {
                    break;
                }

                if ($rule->target_id == $source_id)
                    continue; // Don't link to self

                // Check if already linked to this target
                $already_linked = false;
                foreach ($existing_links as $link) {
                    if ($link->target_id == $rule->target_id) {
                        $already_linked = true;
                        break;
                    }
                }
                if ($already_linked)
                    continue;

                // Match keyword
                $keyword = $rule->keyword;
                $pattern = '/\b' . preg_quote($keyword, '/') . '\b/i';

                if (preg_match($pattern, $content, $matches, PREG_OFFSET_CAPTURE)) {
                    $anchor = $matches[0][0];
                    $offset = $matches[0][1];

                    // Extract context (e.g., 50 chars before and after)
                    $start = max(0, $offset - 50);
                    $context = substr($content, $start, 100 + strlen($anchor));

                    // Check if suggestion already exists in staging
                    $existing_suggestion = $this->suggestion_repo->get_suggestion($source_id, $rule->target_id);
                    if ($existing_suggestion)
                        continue;

                    // Create staged suggestion
                    global $wpdb;
                    $wpdb->insert($wpdb->prefix . 'apexlink_suggestions', [
                        'source_id' => $source_id,
                        'target_id' => $rule->target_id,
                        'anchor' => $anchor,
                        'context' => $context,
                        'score' => 100.00, // Autopilot rules are 100% match by definition
                        'status' => 'pending',
                        'suggestion_type' => 'autopilot'
                    ]);

                    $staged_count++;
                }
            }
        }

        return $staged_count;
    }
}
