<?php

namespace ApexLink\WP\Engine\Analysis;

/**
 * Tokenizer class for splitting text into words and n-grams.
 */
class Tokenizer
{
	/**
	 * Tokenize text into an array of words.
	 *
	 * @param string $text Raw text content.
	 * @return array List of lowercase tokens.
	 */
	public function tokenize(string $text): array
	{
		// Clean text: lowercase and remove non-alphanumeric (keep spaces)
		$text = strtolower($text);
		$text = preg_replace('/[^a-z0-9\s]/', ' ', $text);
		
		// Split by whitespace
		$tokens = preg_split('/\s+/', $text, -1, PREG_SPLIT_NO_EMPTY);
		
		return $tokens ?: [];
	}

	/**
	 * Generate n-grams from a list of tokens.
	 *
	 * @param array $tokens List of words.
	 * @param int $n The size of n-gram (2 for bigrams, 3 for trigrams).
	 * @return array List of n-grams.
	 */
	public function generate_ngrams(array $tokens, int $n): array
	{
		if ($n < 2) {
			return $tokens;
		}

		$ngrams = [];
		$count = count($tokens);

		for ($i = 0; $i <= $count - $n; $i++) {
			$phrase = array_slice($tokens, $i, $n);
			$ngrams[] = implode(' ', $phrase);
		}

		return $ngrams;
	}
}
