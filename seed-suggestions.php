<?php
require_once '/var/www/html/wp-load.php';
global $wpdb;

$table = $wpdb->prefix . 'neurolink_suggestions';

// Clear existing
$wpdb->query("DELETE FROM $table");

$posts = get_posts(['numberposts' => 10, 'post_type' => 'post']);

if (count($posts) < 2) {
    die("Not enough posts to seed suggestions.");
}

// Ensure tables are updated (force version bump check)
ApexLink\WP\Database\SchemaManager::update_schema();

$wpdb->insert($table, [
    'source_id' => $posts[0]->ID,
    'target_id' => $posts[1]->ID,
    'anchor' => 'attention mechanisms',
    'context' => 'One of the most important parts of the architecture is the use of attention mechanisms to focus on specific parts of the input.',
    'score' => 95.50,
    'status' => 'pending'
]);

$wpdb->insert($table, [
    'source_id' => $posts[1]->ID,
    'target_id' => $posts[0]->ID,
    'anchor' => 'Transformers',
    'context' => 'This is a great example of how Transformers have changed the landscape of artificial intelligence in recent years.',
    'score' => 82.10,
    'status' => 'pending'
]);

echo "Seeded 2 suggestions.";
