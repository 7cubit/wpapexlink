<?php

namespace ApexLink\WP\Admin;

use ApexLink\WP\Database\Repositories\IndexRepository;

/**
 * Handle Admin Meta Boxes.
 */
class MetaBox
{

    /**
     * Repository instance.
     *
     * @var IndexRepository
     */
    private $repository;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->repository = new IndexRepository();

        add_action('add_meta_boxes', [$this, 'register_meta_boxes']);
    }

    /**
     * Register meta boxes.
     */
    public function register_meta_boxes()
    {
        add_meta_box(
            'apexlink_keywords',
            __('ApexLink: Detected Keywords', 'wp-apexlink'),
            [$this, 'render_keywords_meta_box'],
            'post',
            'side',
            'default'
        );
    }

    /**
     * Render the keywords meta box.
     *
     * @param \WP_Post $post
     */
    public function render_keywords_meta_box($post)
    {
        $tokens = $this->repository->get_token_data($post->ID);

        if (empty($tokens)) {
            echo '<p>' . esc_html__('No semantic data available yet. Please save the post to trigger indexing.', 'wp-apexlink') . '</p>';
            return;
        }
        if (!is_array($tokens)) {
            echo '<p>' . esc_html__('Error parsing semantic data.', 'wp-apexlink') . '</p>';
            return;
        }

        // Show top 20 keywords
        $top_tokens = array_slice($tokens, 0, 20);

        echo '<div class="apexlink-keywords-list">';
        echo '<table class="widefat fixed striped">';
        echo '<thead><tr><th>' . esc_html__('Keyword (Stemmed)', 'wp-apexlink') . '</th><th>' . esc_html__('Score', 'wp-apexlink') . '</th></tr></thead>';
        echo '<tbody>';
        foreach ($top_tokens as $token => $weight) {
            echo '<tr>';
            echo '<td>' . esc_html($token) . '</td>';
            echo '<td>' . esc_html(number_format($weight * 100, 2)) . '%</td>';
            echo '</tr>';
        }
        echo '</tbody>';
        echo '</table>';
        echo '</div>';

        echo '<p class="description">' . esc_html__('These keywords help build semantic links with other related content.', 'wp-apexlink') . '</p>';
    }
}
