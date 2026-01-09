<?php

namespace ApexLink\WP\Engine\Analysis;

/**
 * Main semantic analysis engine.
 * Coordinates tokenization, stemming, stop word removal, and weighting.
 */
class SemanticAnalyzer
{
    private Tokenizer $tokenizer;
    private Stemmer $stemmer;
    private StopWords $stop_words;

    public function __construct()
    {
        $this->tokenizer = new Tokenizer();
        $this->stemmer = new Stemmer();
        $this->stop_words = new StopWords();
    }

    /**
     * Analyze text and return weighted tokens.
     *
     * @param string $text Cleaned text content.
     * @return array Map of token => weight.
     */
    public function analyze(string $text): array
    {
        // 0. Memory Optimization: Truncate extremely long posts (approx 10k words)
        if (str_word_count($text) > 10000) {
            $words = explode(' ', $text);
            $text = implode(' ', array_slice($words, 0, 10000));
        }

        // 1. Tokenize
        $raw_tokens = $this->tokenizer->tokenize($text);

        // 2. Filter stop words and tiny words
        $filtered_tokens = array_filter($raw_tokens, function ($token) {
            return strlen($token) > 2 && !$this->stop_words->is_stop_word($token);
        });

        // 3. Generate N-grams (Bigrams and Trigrams)
        $bigrams = $this->tokenizer->generate_ngrams($filtered_tokens, 2);
        $trigrams = $this->tokenizer->generate_ngrams($filtered_tokens, 3);

        // 4. Combine all tokens
        $all_potential_tokens = array_merge($filtered_tokens, $bigrams, $trigrams);

        // 5. Stem individual words (don't stem n-grams yet, or stem their components?)
        // For now, let's stem individual words and keep n-grams as is
        $final_tokens = [];
        foreach ($all_potential_tokens as $token) {
            if (str_contains($token, ' ')) {
                // N-gram: stem each word
                $parts = explode(' ', $token);
                $stemmed_parts = array_map([$this->stemmer, 'stem'], $parts);
                $stemmed_token = implode(' ', $stemmed_parts);
            } else {
                $stemmed_token = $this->stemmer->stem($token);
            }
            $final_tokens[] = $stemmed_token;
        }

        // 6. Calculate Term Frequency (TF)
        $counts = array_count_values($final_tokens);
        $total = count($final_tokens);

        $weights = [];
        foreach ($counts as $token => $count) {
            // Basic TF weighting
            $weights[$token] = $count / $total;
        }

        // 7. Sort by weight descending
        arsort($weights);

        return $weights;
    }

    /**
     * Read focus keywords from SEO plugins.
     * 
     * @param int $post_id
     * @return array
     */
    public function get_seo_focus_keywords(int $post_id): array
    {
        $keywords = [];

        // Yoast SEO
        $yoast_kw = get_post_meta($post_id, '_yoast_wpseo_focuskw', true);
        if ($yoast_kw) {
            $keywords[] = strtolower($yoast_kw);
        }

        // Rank Math
        $rank_math_kw = get_post_meta($post_id, 'rank_math_focus_keyword', true);
        if ($rank_math_kw) {
            // Rank Math stores multiple as comma separated
            $parts = explode(',', $rank_math_kw);
            foreach ($parts as $part) {
                $keywords[] = strtolower(trim($part));
            }
        }

        return array_unique($keywords);
    }
}
