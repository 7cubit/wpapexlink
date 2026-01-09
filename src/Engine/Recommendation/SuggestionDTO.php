<?php

namespace ApexLink\WP\Engine\Recommendation;

/**
 * Data Transfer Object for link suggestions.
 */
class SuggestionDTO
{

	public int $post_id;
	public string $title;
	public float $score;
	public ?float $ai_score = null;
	public array $reasons;
	public string $url;
	public bool $is_bridge = false;
	public ?string $generated_bridge = null;

	/**
	 * Constructor.
	 *
	 * @param int    $post_id
	 * @param string $title
	 * @param float  $score
	 * @param array  $reasons
	 * @param string $url
	 * @param float|null $ai_score
	 */
	public function __construct(int $post_id, string $title, float $score, array $reasons, string $url, ?float $ai_score = null)
	{
		$this->post_id = $post_id;
		$this->title = $title;
		$this->score = $score;
		$this->reasons = $reasons;
		$this->url = $url;
		$this->ai_score = $ai_score;
	}

	/**
	 * Convert to array for API response.
	 *
	 * @return array
	 */
	public function to_array(): array
	{
		return [
			'post_id' => $this->post_id,
			'title' => $this->title,
			'score' => round($this->score, 4),
			'ai_score' => $this->ai_score ? round($this->ai_score, 2) : null,
			'reasons' => $this->reasons,
			'url' => $this->url,
			'is_bridge' => $this->is_bridge,
			'generated_bridge' => $this->generated_bridge,
		];
	}
}
