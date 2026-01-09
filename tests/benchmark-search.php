<?php
/**
 * Benchmark semantic search performance.
 */
define('WP_USE_THEMES', false);
require_once(__DIR__ . '/../../../../wp-load.php');

if (!current_user_can('manage_options') && PHP_SAPI !== 'cli') {
    die('Unauthorized');
}

$queries = ['Transformer', 'Neural Network', 'Attention', 'Deep Learning', 'AI'];
$finder = new \NeuroLink\WP\Engine\Recommendation\CandidateFinder();

echo "Benchmarking Semantic Search Performance...\n";
echo "------------------------------------------\n";

foreach ($queries as $query) {
    $start = microtime(true);

    // Simulate finding for a post title by mocking the search method
    // Since we want to benchmark the RAW performance of the query
    global $wpdb;
    $index_table = (new \NeuroLink\WP\Database\Repositories\IndexRepository())->get_table_name();
    $sql = $wpdb->prepare(
        "SELECT p.ID, p.post_title, 
                MATCH(i.stemmed_content) AGAINST (%s) as score
         FROM {$wpdb->posts} p
         JOIN {$index_table} i ON p.ID = i.post_id
         WHERE p.post_status = 'publish' 
           AND MATCH(i.stemmed_content) AGAINST (%s)
         LIMIT 50",
        $query,
        $query
    );
    $wpdb->get_results($sql);

    $end = microtime(true);
    $duration = ($end - $start) * 1000;

    printf(
        "Query: %-20s | Time: %7.2f ms | Status: %s\n",
        $query,
        $duration,
        $duration < 200 ? 'PASS' : 'FAIL'
    );
}
echo "------------------------------------------\n";
echo "Benchmark Complete.\n";
