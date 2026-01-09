<?php

namespace ApexLink\WP\Engine\Analysis;

/**
 * Porter Stemmer algorithm for English.
 * 
 * This class provides a PHP implementation of the Porter Stemming algorithm,
 * used to reduce words to their base or root form.
 */
class Stemmer
{
	/**
	 * Stem a word.
	 *
	 * @param string $word The word to stem.
	 * @return string The stemmed word.
	 */
	public function stem(string $word): string
	{
		$word = strtolower($word);

		if (strlen($word) <= 2) {
			return $word;
		}

		$word = $this->step1($word);
		$word = $this->step2($word);
		$word = $this->step3($word);
		$word = $this->step4($word);
		$word = $this->step5($word);

		return $word;
	}

	/**
	 * Step 1: Handle plurals and past participles.
	 */
	private function step1(string $word): string
	{
		// Step 1a
		if (str_ends_with($word, 'sses')) {
			$word = substr($word, 0, -2);
		} elseif (str_ends_with($word, 'ies')) {
			$word = substr($word, 0, -2);
		} elseif (str_ends_with($word, 'ss')) {
			// keep
		} elseif (str_ends_with($word, 's')) {
			$word = substr($word, 0, -1);
		}

		// Step 1b
		$second_or_third = false;
		if (str_ends_with($word, 'eed')) {
			if ($this->m(substr($word, 0, -3)) > 0) {
				$word = substr($word, 0, -1);
			}
		} elseif (str_ends_with($word, 'ed')) {
			if ($this->contains_vowel(substr($word, 0, -2))) {
				$word = substr($word, 0, -2);
				$second_or_third = true;
			}
		} elseif (str_ends_with($word, 'ing')) {
			if ($this->contains_vowel(substr($word, 0, -3))) {
				$word = substr($word, 0, -3);
				$second_or_third = true;
			}
		}

		if ($second_or_third) {
			if (str_ends_with($word, 'at') || str_ends_with($word, 'bl') || str_ends_with($word, 'iz')) {
				$word .= 'e';
			} elseif ($this->is_double_consonant($word) && !str_ends_with($word, 'l') && !str_ends_with($word, 's') && !str_ends_with($word, 'z')) {
				$word = substr($word, 0, -1);
			} elseif ($this->m($word) == 1 && $this->is_cvc($word)) {
				$word .= 'e';
			}
		}

		// Step 1c
		if (str_ends_with($word, 'y') && $this->contains_vowel(substr($word, 0, -1))) {
			$word = substr($word, 0, -1) . 'i';
		}

		return $word;
	}

	/**
	 * Step 2: Handle suffixes.
	 */
	private function step2(string $word): string
	{
		$suffixes = [
			'ational' => 'ate',
			'tional'  => 'tion',
			'enci'    => 'ence',
			'anci'    => 'ance',
			'izer'    => 'ize',
			'ibli'    => 'ible',
			'alli'    => 'al',
			'entli'   => 'ent',
			'eli'     => 'e',
			'ousli'   => 'ous',
			'ization' => 'ize',
			'ation'   => 'ate',
			'ator'    => 'ate',
			'alism'   => 'al',
			'iveness' => 'ive',
			'fulness' => 'ful',
			'ousness' => 'ous',
			'aliti'   => 'al',
			'iviti'   => 'ive',
			'biliti'  => 'ble',
			'logi'    => 'log',
		];

		foreach ($suffixes as $suffix => $replacement) {
			if (str_ends_with($word, $suffix)) {
				if ($this->m(substr($word, 0, -strlen($suffix))) > 0) {
					return substr($word, 0, -strlen($suffix)) . $replacement;
				}
				break;
			}
		}

		return $word;
	}

	/**
	 * Step 3: Handle -ic-, -full, -ness, etc.
	 */
	private function step3(string $word): string
	{
		$suffixes = [
			'icate' => 'ic',
			'ative' => '',
			'alize' => 'al',
			'iciti' => 'ic',
			'ical'  => 'ic',
			'ful'   => '',
			'ness'  => '',
		];

		foreach ($suffixes as $suffix => $replacement) {
			if (str_ends_with($word, $suffix)) {
				if ($this->m(substr($word, 0, -strlen($suffix))) > 0) {
					return substr($word, 0, -strlen($suffix)) . $replacement;
				}
				break;
			}
		}

		return $word;
	}

	/**
	 * Step 4: Handle -ant, -ence, etc.
	 */
	private function step4(string $word): string
	{
		$suffixes = [
			'al', 'ance', 'ence', 'er', 'ic', 'able', 'ible', 'ant', 'ement', 'ment', 'ent',
			'ou', 'ism', 'ate', 'iti', 'ous', 'ive', 'ize'
		];

		foreach ($suffixes as $suffix) {
			if (str_ends_with($word, $suffix)) {
				if ($this->m(substr($word, 0, -strlen($suffix))) > 1) {
					return substr($word, 0, -strlen($suffix));
				}
				break;
			}
		}

		if (str_ends_with($word, 'ion')) {
			$stem = substr($word, 0, -3);
			if ($this->m($stem) > 1 && (str_ends_with($stem, 's') || str_ends_with($stem, 't'))) {
				return $stem;
			}
		}

		return $word;
	}

	/**
	 * Step 5: Final cleanup.
	 */
	private function step5(string $word): string
	{
		// Step 5a
		if (str_ends_with($word, 'e')) {
			$stem = substr($word, 0, -1);
			$m = $this->m($stem);
			if ($m > 1 || ($m == 1 && !$this->is_cvc($stem))) {
				$word = $stem;
			}
		}

		// Step 5b
		if ($this->m($word) > 1 && $this->is_double_consonant($word) && str_ends_with($word, 'l')) {
			$word = substr($word, 0, -1);
		}

		return $word;
	}

	/**
	 * Measure the complexity of a word (m).
	 */
	private function m(string $word): int
	{
		$n = 0;
		$state = 0; // 0 = start, 1 = C, 2 = V
		$len = strlen($word);

		for ($i = 0; $i < $len; $i++) {
			$is_vowel = $this->is_vowel($word, $i);
			if ($state == 0) {
				$state = $is_vowel ? 2 : 1;
			} elseif ($state == 1) {
				if ($is_vowel) $state = 2;
			} elseif ($state == 2) {
				if (!$is_vowel) {
					$state = 1;
					$n++;
				}
			}
		}

		return $n;
	}

	private function is_vowel(string $word, int $i): bool
	{
		$vowels = ['a', 'e', 'i', 'o', 'u'];
		$char = $word[$i];
		if (in_array($char, $vowels)) {
			return true;
		}
		if ($char == 'y' && $i > 0 && !$this->is_vowel($word, $i - 1)) {
			return true;
		}
		return false;
	}

	private function contains_vowel(string $word): bool
	{
		for ($i = 0; $i < strlen($word); $i++) {
			if ($this->is_vowel($word, $i)) {
				return true;
			}
		}
		return false;
	}

	private function is_double_consonant(string $word): bool
	{
		$len = strlen($word);
		if ($len < 2) return false;
		return $word[$len - 1] == $word[$len - 2] && !$this->is_vowel($word, $len - 1);
	}

	private function is_cvc(string $word): bool
	{
		$len = strlen($word);
		if ($len < 3) return false;
		if ($this->is_vowel($word, $len - 1) || !$this->is_vowel($word, $len - 2) || $this->is_vowel($word, $len - 3)) {
			return false;
		}
		$last = $word[$len - 1];
		if ($last == 'w' || $last == 'x' || $last == 'y') {
			return false;
		}
		return true;
	}
}
