<?php

namespace ApexLink\WP\Engine\Analysis;

/**
 * PageRank calculation engine using the Iterative Power Method.
 * 
 * Optimized for sparse matrices to avoid O(N^2) memory complexity.
 */
class PageRankEngine {

    /**
     * @var float Damping factor (d)
     */
    private $damping_factor = 0.85;

    /**
     * @var int Maximum iterations
     */
    private $max_iterations = 100;

    /**
     * @var float Convergence threshold
     */
    private $convergence = 0.0001;

    /**
     * Calculate PageRank for a given graph.
     * 
     * @param array $matrix Adjacency list: [source_id => [target_id1, target_id2, ...]]
     * @return array [post_id => rank_score]
     */
    public function calculate(array $matrix): array {
        $num_nodes = count($matrix);
        if ($num_nodes === 0) {
            return [];
        }

        $initial_score = 1.0 / $num_nodes;
        $ranks = array_fill_keys(array_keys($matrix), $initial_score);
        
        // Preparation: Find nodes with no outbound links (sinks)
        $out_counts = [];
        foreach ($matrix as $node => $targets) {
            $out_counts[$node] = count($targets);
        }

        for ($i = 0; $i < $this->max_iterations; $i++) {
            $new_ranks = array_fill_keys(array_keys($matrix), 0);
            $sink_sum = 0;

            // Calculate score contribution from each node
            foreach ($ranks as $node => $rank) {
                if ($out_counts[$node] > 0) {
                    $contribution = $rank / $out_counts[$node];
                    foreach ($matrix[$node] as $target) {
                        if (isset($new_ranks[$target])) {
                            $new_ranks[$target] += $contribution;
                        }
                    }
                } else {
                    // Sink node: its rank is shared equally among all nodes
                    $sink_sum += $rank;
                }
            }

            // Apply damping factor and distribute sink/base scores
            $base_score = (1.0 - $this->damping_factor) / $num_nodes;
            $sink_distribution = ($this->damping_factor * $sink_sum) / $num_nodes;
            
            $max_diff = 0;
            foreach ($new_ranks as $node => &$rank) {
                $rank = $base_score + $sink_distribution + ($this->damping_factor * $rank);
                $diff = abs($rank - $ranks[$node]);
                if ($diff > $max_diff) {
                    $max_diff = $diff;
                }
            }

            $ranks = $new_ranks;

            // Check for convergence
            if ($max_diff < $this->convergence) {
                break;
            }
        }

        return $ranks;
    }

    /**
     * Normalize raw PageRank scores to a 0-100 scale.
     * 
     * Uses a logarithmic scale since PR values often follow a power law distribution.
     * 
     * @param array $ranks [id => raw_score]
     * @return array [id => normalized_score]
     */
    public function normalize(array $ranks): array {
        if (empty($ranks)) {
            return [];
        }

        $min = min($ranks);
        $max = max($ranks);

        if ($max === $min) {
            return array_fill_keys(array_keys($ranks), 50.0);
        }

        $normalized = [];
        foreach ($ranks as $id => $score) {
            // Logarithmic normalization: log(score/min) / log(max/min)
            // We add a tiny epsilon to avoid log(0)
            $eps = 1e-10;
            $val = (log($score + $eps) - log($min + $eps)) / (log($max + $eps) - log($min + $eps));
            $normalized[$id] = round($val * 100, 2);
        }

        return $normalized;
    }
}
