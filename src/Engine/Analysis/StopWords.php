<?php

namespace ApexLink\WP\Engine\Analysis;

/**
 * Stop Word management for English.
 */
class StopWords
{
	/**
	 * List of common English stop words.
	 *
	 * @var array
	 */
	private array $stop_words = [
		'a', 'about', 'above', 'after', 'again', 'against', 'all', 'am', 'an', 'and', 'any', 'are', 'as', 'at', 'be', 'because', 'been', 'before', 'being', 'below', 'between', 'both', 'but', 'by', 'could', 'did', 'do', 'does', 'doing', 'down', 'during', 'each', 'few', 'for', 'from', 'further', 'had', 'has', 'have', 'having', 'here', 'how', 'if', 'in', 'into', 'is', 'it', 'its', 'itself', 'just', 'me', 'more', 'most', 'my', 'myself', 'no', 'nor', 'not', 'of', 'off', 'on', 'once', 'only', 'or', 'other', 'ought', 'our', 'ours', 'ourselves', 'out', 'over', 'own', 'same', 'she', 'should', 'so', 'some', 'such', 'than', 'that', 'the', 'their', 'theirs', 'them', 'themselves', 'then', 'there', 'these', 'they', 'this', 'those', 'through', 'to', 'too', 'under', 'until', 'up', 'very', 'was', 'we', 'were', 'what', 'when', 'where', 'which', 'while', 'who', 'whom', 'why', 'with', 'would', 'you', 'your', 'yours', 'yourself', 'yourselves'
	];

	/**
	 * Check if a word is a stop word.
	 *
	 * @param string $word
	 * @return bool
	 */
	public function is_stop_word(string $word): bool
	{
		$word = strtolower($word);
		
		/**
		 * Filter the stop words list.
		 * 
		 * @param array $stop_words Default list of stop words.
		 */
		$filtered_stop_words = apply_filters('apexlink_stop_words', $this->stop_words);
		
		return in_array($word, $filtered_stop_words);
	}

	/**
	 * Get the full list of stop words.
	 * 
	 * @return array
	 */
	public function get_all(): array
	{
		return apply_filters('apexlink_stop_words', $this->stop_words);
	}
}
