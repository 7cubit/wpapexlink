<?php

namespace ApexLink\WP\Engine\Analysis;

use ApexLink\WP\Database\Repositories\LinkRepository;

/**
 * Service to build the link graph adjacency matrix.
 */
class GraphBuilder
{

    /**
     * @var LinkRepository
     */
    private $link_repository;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->link_repository = new LinkRepository();
    }

    /**
     * Build a sparse adjacency matrix of the internal link graph.
     *
     * Returns an array where keys are post IDs and values are arrays of target post IDs.
     *
     * @return array
     */
    public function build_matrix()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'apexlink_links';

        // Get all internal links, excluding nofollow
        $links = $wpdb->get_results("SELECT source_id, target_id FROM {$table} WHERE link_type = 'internal' AND is_nofollow = 0");

        $matrix = [];
        $all_nodes = [];

        foreach ($links as $link) {
            $source = (int) $link->source_id;
            $target = (int) $link->target_id;

            if (!isset($matrix[$source])) {
                $matrix[$source] = [];
            }

            // Add edge but avoid duplicate links between same posts for PR simplicity
            if (!in_array($target, $matrix[$source], true)) {
                $matrix[$source][] = $target;
            }

            $all_nodes[$source] = true;
            $all_nodes[$target] = true;
        }

        // Ensure all nodes exist in the matrix even if they have no outbound links
        foreach (array_keys($all_nodes) as $node_id) {
            if (!isset($matrix[$node_id])) {
                $matrix[$node_id] = [];
            }
        }

        return $matrix;
    }

    /**
     * Get all post IDs that should be part of the graph.
     * 
     * @return int[]
     */
    public function get_node_ids()
    {
        global $wpdb;
        $table = $wpdb->prefix . 'apexlink_index';
        return array_map('intval', $wpdb->get_col("SELECT post_id FROM {$table}"));
    }
}
