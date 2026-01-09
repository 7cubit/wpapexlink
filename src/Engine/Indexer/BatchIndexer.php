<?php

namespace ApexLink\WP\Engine\Indexer;

/**
 * Handle batch indexing and global graph calculations.
 */
class BatchIndexer
{

    /**
     * Constructor.
     */
    public function __construct()
    {
        add_action('apexlink_index_batch', [$this, 'process_batch']);
        add_action('apexlink_rebuild_graph', [$this, 'rebuild_graph']);
    }

    /**
     * Dispatch a batch indexing job.
     * 
     * @param int $batch_size Number of posts per batch.
     */
    public function dispatch_batch(int $batch_size = 25)
    {
        as_enqueue_async_action('apexlink_index_batch', ['size' => $batch_size], 'apexlink');
    }

    /**
     * Process a batch of posts that need indexing.
     *
     * @param int $size
     */
    public function process_batch(int $size)
    {
        if (get_option('apexlink_pause_queue', false)) {
            return;
        }

        global $wpdb;
        $indexer = new Indexer();

        // Memory protection: if we're low on memory, stop the batch early
        $memory_limit = $this->get_memory_limit();
        $memory_usage = memory_get_usage(true);

        // Find posts that need indexing (content changed or never indexed)
        $posts = $wpdb->get_col($wpdb->prepare("
			SELECT p.ID FROM {$wpdb->posts} p
			LEFT JOIN {$wpdb->prefix}apexlink_index i ON p.ID = i.post_id
			WHERE p.post_type = 'post' AND p.post_status = 'publish'
			AND (i.id IS NULL OR p.post_modified > i.indexed_at)
			LIMIT %d", $size));

        if (empty($posts)) {
            return;
        }

        foreach ($posts as $post_id) {
            // Check memory usage before each post processing
            if (memory_get_usage(true) > $memory_limit * 0.8) {
                \ApexLink\WP\wp_apexlink()->logger()->warning('Batch indexing paused due to high memory usage.');
                break;
            }

            $indexer->index_post((int) $post_id);
        }

        // If we processed a full batch and not paused, schedule the next one
        if (count($posts) === $size && !get_option('apexlink_pause_queue', false)) {
            $this->dispatch_batch($size);
        }
    }

    /**
     * Get PHP memory limit in bytes.
     *
     * @return int
     */
    private function get_memory_limit()
    {
        $limit = ini_get('memory_limit');
        if (-1 == $limit) {
            return 256 * 1024 * 1024; // Default to 256MB if no limit
        }

        $unit = strtolower(substr($limit, -1));
        $bytes = (int) $limit;

        switch ($unit) {
            case 'g':
                $bytes *= 1024;
            case 'm':
                $bytes *= 1024;
            case 'k':
                $bytes *= 1024;
        }

        return $bytes;
    }

    /**
     * Dispatch a global graph recalculation.
     */
    public function dispatch_graph_rebuild()
    {
        as_enqueue_async_action('apexlink_rebuild_graph', [], 'apexlink');
    }

    /**
     * Rebuild the global link graph and calculate PageRank.
     */
    public function rebuild_graph()
    {
        \ApexLink\WP\wp_apexlink()->logger()->info('Starting global link graph PageRank calculation...');

        $builder = new \ApexLink\WP\Engine\Analysis\GraphBuilder();
        $engine = new \ApexLink\WP\Engine\Analysis\PageRankEngine();
        $stats_repository = new \ApexLink\WP\Database\Repositories\StatsRepository();

        // 1. Build Adjacency Matrix
        $matrix = $builder->build_matrix();

        if (empty($matrix)) {
            \ApexLink\WP\wp_apexlink()->logger()->warning('Graph build failed: No internal links found.');
            return;
        }

        // 2. Run PageRank Iterations
        $raw_ranks = $engine->calculate($matrix);

        // 3. Normalize to 0-100
        $normalized_ranks = $engine->normalize($raw_ranks);

        // 4. Persistence
        foreach ($normalized_ranks as $post_id => $score) {
            // Also calculate simple inbound/outbound counts while we're at it
            $inbound = 0;
            foreach ($matrix as $source => $targets) {
                if (in_array($post_id, $targets, true)) {
                    $inbound++;
                }
            }
            $outbound = count($matrix[$post_id] ?? []);

            $stats_repository->update_pagerank_score((int) $post_id, (float) $score);
            $stats_repository->update_counts((int) $post_id, $inbound, $outbound);
        }

        \ApexLink\WP\wp_apexlink()->logger()->info('Global link graph calculation complete.');
    }
}
