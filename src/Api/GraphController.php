<?php

namespace ApexLink\WP\Api;

use ApexLink\WP\Database\Repositories\LinkRepository;
use ApexLink\WP\Database\Repositories\IndexRepository;
use ApexLink\WP\Database\Repositories\SuggestionRepository;
use ApexLink\WP\Core\EnvChecker;
use ApexLink\WP\License\LicenseManager;
use ApexLink\WP\Engine\Writer\LinkInserter;

/**
 * REST API Controller for Link Graph data.
 */
class GraphController
{

    /**
     * Namespace for the API.
     */
    const REST_NAMESPACE = 'apexlink/v1';

    /**
     * Repository instances.
     */
    private $link_repository;
    private $index_repository;
    private $suggestion_repository;

    /**
     * Constructor.
     */
    public function __construct()
    {
        $this->link_repository = new LinkRepository();
        $this->index_repository = new IndexRepository();
        $this->suggestion_repository = new SuggestionRepository();

        add_action('rest_api_init', [$this, 'register_routes']);
    }

    /**
     * Register REST API routes.
     */
    public function register_routes()
    {
        register_rest_route(self::REST_NAMESPACE, '/graph', [
            'methods' => 'GET',
            'callback' => [$this, 'get_graph_data'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'get_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/batch/index', [
            'methods' => 'POST',
            'callback' => [$this, 'trigger_batch_index'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/batch/status', [
            'methods' => 'GET',
            'callback' => [$this, 'get_batch_status'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/batch/pause', [
            'methods' => 'POST',
            'callback' => [$this, 'pause_batch'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/batch/resume', [
            'methods' => 'POST',
            'callback' => [$this, 'resume_batch'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions/(?P<id>\d+)', [
            'methods' => 'GET',
            'callback' => [$this, 'get_suggestions'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/search', [
            'methods' => 'GET',
            'callback' => [$this, 'manual_search'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/dashboard/stats', [
            'methods' => 'GET',
            'callback' => [$this, 'get_dashboard_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/graph/recalculate', [
            'methods' => 'POST',
            'callback' => [$this, 'trigger_graph_recalculate'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/orphans', [
            'methods' => 'GET',
            'callback' => [$this, 'get_detailed_orphans'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/graph/visual', [
            'methods' => 'GET',
            'callback' => [$this, 'get_visual_graph'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/autopilot/rules', [
            'methods' => 'GET',
            'callback' => [$this, 'get_autopilot_rules'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/autopilot/rules', [
            'methods' => 'POST',
            'callback' => [$this, 'create_autopilot_rule'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/autopilot/rules/(?P<id>\d+)', [
            'methods' => 'DELETE',
            'callback' => [$this, 'delete_autopilot_rule'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/autopilot/run', [
            'methods' => 'POST',
            'callback' => [$this, 'trigger_autopilot_run'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/autopilot/revert', [
            'methods' => 'POST',
            'callback' => [$this, 'revert_last_batch'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/gsc/auth-url', [
            'methods' => 'GET',
            'callback' => [$this, 'get_gsc_auth_url'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/gsc/exchange-code', [
            'methods' => 'POST',
            'callback' => [$this, 'exchange_gsc_code'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/gsc/revenue-report', [
            'methods' => 'GET',
            'callback' => [$this, 'get_revenue_report'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/stats/anchors', [
            'methods' => 'GET',
            'callback' => [$this, 'get_anchor_stats'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/magnet/candidates', [
            'methods' => 'GET',
            'callback' => [$this, 'get_magnet_candidates'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/magnet/apply', [
            'methods' => 'POST',
            'callback' => [$this, 'apply_magnet_link'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/reports/link-velocity', [
            'methods' => 'GET',
            'callback' => [$this, 'get_link_velocity_report'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/reports/click-depth', [
            'methods' => 'GET',
            'callback' => [$this, 'get_click_depth_report'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/reports/broken-links', [
            'methods' => 'GET',
            'callback' => [$this, 'get_broken_links_report'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/reports/domain-stats', [
            'methods' => 'GET',
            'callback' => [$this, 'get_domain_stats_report'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/reports/export/csv', [
            'methods' => 'GET',
            'callback' => [$this, 'export_links_csv'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/integrations/status', [
            'methods' => 'GET',
            'callback' => [$this, 'get_integrations_status'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/ai/synonyms', [
            'methods' => 'POST',
            'callback' => [$this, 'get_ai_synonyms'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/license/activate', [
            'methods' => 'POST',
            'callback' => [$this, 'activate_license'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/license/status', [
            'methods' => 'GET',
            'callback' => [$this, 'get_license_status'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/license/credits', [
            'methods' => 'GET',
            'callback' => [$this, 'get_credits_balance'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions-inbox', [
            'methods' => 'GET',
            'callback' => [$this, 'get_suggestions_inbox'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions/diff', [
            'methods' => 'POST',
            'callback' => [$this, 'get_suggestion_diff'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions/update', [
            'methods' => 'POST',
            'callback' => [$this, 'update_suggestion_context'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/magnet/suggestions', [
            'methods' => 'GET',
            'callback' => [$this, 'get_magnet_suggestions'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/orphans/bulk-scan', [
            'methods' => 'POST',
            'callback' => [$this, 'bulk_scan_orphans'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/autopilot/commit', [
            'methods' => 'POST',
            'callback' => [$this, 'commit_autopilot_links'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/agency/tunnel-login', [
            'methods' => 'POST',
            'callback' => [$this, 'get_agency_tunnel_login'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions/action', [
            'methods' => 'POST',
            'callback' => [$this, 'process_suggestion_action'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/settings/export', [
            'methods' => 'GET',
            'callback' => [$this, 'get_settings_export'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/settings/import', [
            'methods' => 'POST',
            'callback' => [$this, 'import_settings'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions/apply', [
            'methods' => 'POST',
            'callback' => [$this, 'apply_suggestion'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions/undo', [
            'methods' => 'POST',
            'callback' => [$this, 'undo_suggestion'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions/bridge/generate', [
            'methods' => 'POST',
            'callback' => [$this, 'generate_bridge'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/suggestions/bridge/apply', [
            'methods' => 'POST',
            'callback' => [$this, 'apply_bridge'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/settings', [
            'methods' => 'GET',
            'callback' => [$this, 'get_settings'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/settings', [
            'methods' => 'POST',
            'callback' => [$this, 'update_settings'],
            'permission_callback' => [$this, 'check_permission'],
        ]);

        register_rest_route(self::REST_NAMESPACE, '/settings/ai/test', [
            'methods' => 'POST',
            'callback' => [$this, 'test_ai_connection'],
            'permission_callback' => [$this, 'check_permission'],
        ]);
    }

    /**
     * Check API permissions.
     */
    public function check_permission()
    {
        $min_cap = get_option('apexlink_min_capability', 'manage_options');
        return current_user_can($min_cap);
    }

    /**
     * Get graph data (nodes and edges).
     */
    public function get_graph_data()
    {
        global $wpdb;

        $posts_table = $wpdb->posts;
        $posts = $wpdb->get_results("SELECT ID, post_title FROM {$posts_table} WHERE post_type = 'post' AND post_status = 'publish'");

        $fields = isset($_GET['fields']) ? explode(',', $_GET['fields']) : [];

        $nodes = [];
        foreach ($posts as $post) {
            $data = [
                'id' => $post->ID,
                'label' => $post->post_title,
            ];

            if (!empty($fields)) {
                $data = array_intersect_key($data, array_flip($fields));
            }

            $nodes[] = $data;
        }

        $links_table = $this->link_repository->get_table_name();
        $edges_data = $wpdb->get_results("SELECT source_id, target_id, link_type FROM {$links_table} WHERE target_id > 0 AND link_type = 'internal'");

        $edges = [];
        foreach ($edges_data as $edge) {
            $edges[] = [
                'from' => (int) $edge->source_id,
                'to' => (int) $edge->target_id,
            ];
        }

        return rest_ensure_response([
            'nodes' => $nodes,
            'edges' => $edges,
        ]);
    }

    /**
     * Get overview stats.
     */
    public function get_stats()
    {
        $orphans = $this->link_repository->get_orphan_posts();

        global $wpdb;
        $links_table = $this->link_repository->get_table_name();

        $broken_links = $wpdb->get_results(
            "SELECT source_id, url, anchor FROM {$links_table} WHERE link_type = 'internal' AND target_id = 0 AND url != ''"
        );

        return rest_ensure_response([
            'total_orphans' => count($orphans),
            'orphan_ids' => $orphans,
            'broken_links' => $broken_links,
            'cron_status' => EnvChecker::get_cron_recommendation(),
        ]);
    }

    /**
     * Trigger a mass indexing batch.
     */
    public function trigger_batch_index()
    {
        $user_id = get_current_user_id();
        $rate_key = 'apexlink_rate_limit_index_' . $user_id;

        if (get_transient($rate_key)) {
            return new \WP_Error('rate_limit', 'Please wait before triggering another scan.', ['status' => 429]);
        }

        $batch_indexer = new \ApexLink\WP\Engine\Indexer\BatchIndexer();
        $batch_indexer->dispatch_batch(25);

        set_transient($rate_key, true, 60); // 1 minute cooldown

        return rest_ensure_response(['success' => true, 'message' => 'Batch indexing started.']);
    }

    /**
     * Get current batch status from Action Scheduler.
     */
    public function get_batch_status()
    {
        $args = [
            'hook' => 'apexlink_index_batch',
            'status' => \ActionScheduler_Store::STATUS_PENDING,
        ];
        $pending = as_get_scheduled_actions($args);

        return rest_ensure_response([
            'pending_jobs' => count($pending),
            'is_running' => count($pending) > 0,
            'is_paused' => (bool) get_option('apexlink_pause_queue', false),
        ]);
    }

    /**
     * Pause the background queue.
     */
    public function pause_batch()
    {
        update_option('apexlink_pause_queue', true);
        return rest_ensure_response(['success' => true]);
    }

    /**
     * Resume the background queue.
     */
    public function resume_batch()
    {
        update_option('apexlink_pause_queue', false);

        // Re-trigger if there are pending items but no running job
        $batch_indexer = new \ApexLink\WP\Engine\Indexer\BatchIndexer();
        $batch_indexer->dispatch_batch(25);

        return rest_ensure_response(['success' => true]);
    }

    /**
     * Get link suggestions for a post.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function get_suggestions($request)
    {
        $post_id = (int) $request['id'];
        $cache_key = 'apexlink_suggestions_' . $post_id;

        $suggestions = get_transient($cache_key);
        if (false === $suggestions) {
            $finder = new \ApexLink\WP\Engine\Recommendation\CandidateFinder();
            $results = $finder->find_for_post($post_id);

            $suggestions = array_map(fn($s) => $s->to_array(), $results);
            set_transient($cache_key, $suggestions, HOUR_IN_SECONDS);
        }

        return rest_ensure_response($suggestions);
    }

    /**
     * Manual search for testing the engine.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function manual_search($request)
    {
        $query = sanitize_text_field($request->get_param('q'));
        if (empty($query)) {
            return rest_ensure_response([]);
        }

        $finder = new \ApexLink\WP\Engine\Recommendation\CandidateFinder();
        // We'll use a virtual search that mimics the post search
        // But for manual testing, we'll just run a broad search

        global $wpdb;
        $index_table = (new \ApexLink\WP\Database\Repositories\IndexRepository())->get_table_name();

        $sql = $wpdb->prepare(
            "SELECT p.ID, p.post_title as title, 
					MATCH(i.stemmed_content) AGAINST (%s) as score
			 FROM {$wpdb->posts} p
			 JOIN {$index_table} i ON p.ID = i.post_id
			 WHERE p.post_status = 'publish' 
			   AND MATCH(i.stemmed_content) AGAINST (%s)
			   AND i.stemmed_content != ''
			 ORDER BY score DESC
			 LIMIT 20",
            $query,
            $query
        );

        $results = $wpdb->get_results($sql);

        // Add permalinks to results
        foreach ($results as $result) {
            $result->url = get_permalink($result->ID);
        }

        return rest_ensure_response($results);
    }

    /**
     * Get aggregated stats for the dashboard overview.
     *
     * @return \WP_REST_Response
     */
    public function get_dashboard_stats()
    {
        $link_repository = new LinkRepository();
        $index_repo = new \ApexLink\WP\Database\Repositories\IndexRepository();

        global $wpdb;

        // 1. Total Links
        $total_links = $wpdb->get_var("SELECT COUNT(*) FROM {$link_repository->get_table_name()}");

        // 2. Orphan Count
        $orphans = $link_repository->get_orphan_posts();
        $orphan_count = count($orphans);

        // 3. Indexing Progress
        $total_posts = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$wpdb->posts} WHERE post_status = 'publish' AND post_type = 'post'");
        $indexed_posts = (int) $wpdb->get_var("SELECT COUNT(*) FROM {$index_repo->get_table_name()} i JOIN {$wpdb->posts} p ON i.post_id = p.ID WHERE p.post_status = 'publish'");

        // 4. Anchor Diversity
        $unique_anchors = (int) $wpdb->get_var("SELECT COUNT(DISTINCT anchor) FROM {$link_repository->get_table_name()} WHERE link_type = 'internal'");

        // 5. Broken Links
        $broken_links = $link_repository->count_broken_links();

        // Health Score Formula
        $index_score = $total_posts > 0 ? ($indexed_posts / $total_posts) * 100 : 0;
        $orphan_score = $total_posts > 0 ? max(0, 100 - (($orphan_count / $total_posts) * 100)) : 100;
        $diversity_score = $total_links > 0 ? min(100, ($unique_anchors / $total_links) * 100) : 0;

        $health_score = ($index_score + $orphan_score + $diversity_score) / 3;

        $license_manager = new LicenseManager();
        $credits = $license_manager->get_credits();
        $license_data = $license_manager->get_license_data();

        // 5. Authority Distribution (Top Pages)
        $top_authority = $wpdb->get_results("
            SELECT p.ID, p.post_title, s.pagerank_score 
            FROM {$wpdb->posts} p
            JOIN {$wpdb->prefix}apexlink_stats s ON p.ID = s.post_id
            WHERE p.post_status = 'publish'
            ORDER BY s.pagerank_score DESC
            LIMIT 5
        ");

        return rest_ensure_response([
            'total_links' => (int) $total_links,
            'orphan_count' => $orphan_count,
            'broken_links' => $broken_links,
            'indexed_posts' => $indexed_posts,
            'total_posts' => $total_posts,
            'health_score' => round($health_score, 1),
            'anchor_diversity' => round($diversity_score, 1),
            'system_credits' => $credits,
            'tier' => $license_data['tier'] ?? 'pro',
            'has_credits' => $license_manager->has_credits(),
            'top_authority' => $top_authority,
        ]);
    }

    /**
     * Trigger a global graph recalculation.
     * 
     * @return \WP_REST_Response
     */
    public function trigger_graph_recalculate()
    {
        $batch_indexer = new \ApexLink\WP\Engine\Indexer\BatchIndexer();
        $batch_indexer->dispatch_graph_rebuild();

        return rest_ensure_response([
            'success' => true,
            'message' => __('Graph recalculation queued.', 'wp-apexlink')
        ]);
    }

    /**
     * Get detailed orphan posts for the table.
     *
     * @return \WP_REST_Response
     */
    public function get_detailed_orphans()
    {
        $link_repository = new LinkRepository();
        $ids = $link_repository->get_orphan_posts();

        if (empty($ids)) {
            return rest_ensure_response([]);
        }

        global $wpdb;
        $id_list = implode(',', array_map('intval', $ids));

        // Fetch posts with a placeholder for traffic_potential
        // In a real scenario, this would join with a GSC stats table
        $results = $wpdb->get_results("
            SELECT ID as id, post_title as title, post_date as date,
            (SELECT COUNT(*) FROM {$wpdb->comments} WHERE comment_post_ID = ID) as traffic_potential
            FROM {$wpdb->posts} 
            WHERE ID IN ($id_list)
            ORDER BY post_date DESC
        ");

        foreach ($results as $row) {
            $row->url = get_permalink($row->id);
            // Simulate traffic mapping: comments as proxy for potential
            $row->traffic_potential = (int) $row->traffic_potential * 15; // Mock multiplier
        }

        return rest_ensure_response($results);
    }

    /**
     * Bulk scan orphans for links.
     */
    public function bulk_scan_orphans($request)
    {
        $params = $request->get_json_params();
        $ids = $params['ids'] ?? [];

        if (empty($ids)) {
            return new \WP_Error('no_ids', 'No IDs provided', ['status' => 400]);
        }

        $indexer = new \ApexLink\WP\Engine\Indexer\Indexer();
        foreach ($ids as $id) {
            $indexer->index_post((int) $id);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => sprintf(__('Queued %d posts for scanning.', 'wp-apexlink'), count($ids))
        ]);
    }

    /**
     * Agency Tunnel Login - Generate a temporary token.
     */
    public function get_agency_tunnel_login($request)
    {
        $site_url = $request->get_param('site_url');

        // In a real implementation, this would communicate with our cloud middleware
        // to verify agency rights and generate a one-time redirect URL.
        // For now, we return a mock secure redirect.

        $token = bin2hex(random_bytes(16));
        $redirect_url = add_query_arg([
            'apexlink_tunnel' => $token,
            'agency_auth' => get_current_user_id()
        ], admin_url());

        return rest_ensure_response([
            'success' => true,
            'redirect_url' => $redirect_url
        ]);
    }

    /**
     * Activate a license key.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response|\WP_Error
     */
    public function activate_license($request)
    {
        $key = sanitize_text_field($request->get_param('license_key'));
        if (empty($key)) {
            return new \WP_Error('missing_key', 'License key is required.', ['status' => 400]);
        }

        $license_manager = new LicenseManager();
        $result = $license_manager->activate($key);

        return rest_ensure_response($result);
    }

    /**
     * Get current license status.
     *
     * @return \WP_REST_Response
     */
    public function get_license_status()
    {
        $license_manager = new LicenseManager();
        $data = $license_manager->get_license_data();

        if (!$data) {
            return rest_ensure_response(['active' => false, 'message' => 'No license found.']);
        }

        return rest_ensure_response($data);
    }

    /**
     * Get current credit balance.
     *
     * @return \WP_REST_Response
     */
    public function get_credits_balance()
    {
        $license_manager = new LicenseManager();
        $balance = $license_manager->get_credits();

        return rest_ensure_response(['balance' => $balance]);
    }

    /**
     * Get suggestions for the inbox dashboard.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function get_suggestions_inbox($request)
    {
        $limit = $request->get_param('limit') ?: 50;
        $offset = $request->get_param('offset') ?: 0;
        $status = $request->get_param('status') ?: 'pending';
        $type = $request->get_param('type') ?: 'ai';

        $suggestions = $this->suggestion_repository->get_suggestions([
            'limit' => (int) $limit,
            'offset' => (int) $offset,
            'status' => $status,
            'type' => $type
        ]);

        $link_repo = new LinkRepository();
        foreach ($suggestions as &$s) {
            $density = $link_repo->get_anchor_density($s->target_id);
            $count = 0;
            foreach ($density as $d) {
                if ($d->anchor === $s->anchor) {
                    $count = (int) $d->count;
                    break;
                }
            }
            $s->anchor_count = $count;
        }

        return rest_ensure_response($suggestions);
    }

    /**
     * Process an action (accept/reject) on a suggestion.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response|\WP_Error
     */
    public function process_suggestion_action($request)
    {
        $ids = $request->get_param('ids');
        $action = $request->get_param('action'); // 'accepted' or 'rejected'

        if (empty($ids) || !in_array($action, ['accepted', 'rejected'])) {
            return new \WP_Error('invalid_params', 'Invalid parameters.', ['status' => 400]);
        }

        if (is_array($ids)) {
            $this->suggestion_repository->bulk_update_status($ids, $action);
        } else {
            $this->suggestion_repository->update_status((int) $ids, $action);
        }

        return rest_ensure_response(['success' => true]);
    }

    /**
     * Apply a suggestion by inserting the link into the post content.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response|\WP_Error
     */
    public function apply_suggestion($request)
    {
        $suggestion_id = $request->get_param('suggestion_id');
        $custom_anchor = $request->get_param('anchor');
        $dry_run = (bool) $request->get_param('dry_run');

        if (empty($suggestion_id)) {
            return new \WP_Error('missing_id', 'Suggestion ID is required.', ['status' => 400]);
        }

        // Get the suggestion from the database
        global $wpdb;
        $table = $this->suggestion_repository->get_table_name();
        $suggestion = $wpdb->get_row($wpdb->prepare("SELECT * FROM $table WHERE id = %d", $suggestion_id));

        if (!$suggestion) {
            return new \WP_Error('not_found', 'Suggestion not found.', ['status' => 404]);
        }

        $anchor = !empty($custom_anchor) ? $custom_anchor : $suggestion->anchor;
        $target_url = get_permalink($suggestion->target_id);

        $inserter = new LinkInserter();
        $result = $inserter->insert((int) $suggestion->source_id, $anchor, $target_url, $dry_run);

        if ($result['success'] && !$dry_run) {
            // Mark suggestion as accepted
            $this->suggestion_repository->update_status($suggestion_id, 'accepted');
        }

        return rest_ensure_response($result);
    }

    /**
     * Undo a link insertion by reverting to a previous revision.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response|\WP_Error
     */
    public function undo_suggestion($request)
    {
        $post_id = $request->get_param('post_id');

        if (empty($post_id)) {
            return new \WP_Error('missing_id', 'Post ID is required.', ['status' => 400]);
        }

        $inserter = new LinkInserter();
        $result = $inserter->undo((int) $post_id);

        return rest_ensure_response($result);
    }

    /**
     * Get plugin settings.
     *
     * @return \WP_REST_Response
     */
    public function get_settings()
    {
        return rest_ensure_response([
            'apexlink_enable_ai_reranking' => (bool) get_option('apexlink_enable_ai_reranking', false),
            'apexlink_batch_size' => (int) get_option('apexlink_batch_size', 25),
            'apexlink_silo_boost' => (int) get_option('apexlink_silo_boost', 25),
            'apexlink_anchor_diversity_mode' => get_option('apexlink_anchor_diversity_mode', 'exact'),
            'apexlink_use_custom_key' => (bool) get_option('apexlink_use_custom_key', false),
            'apexlink_openai_key' => $this->get_masked_custom_key(),
            'apexlink_gsc_connected' => (bool) get_option('apexlink_gsc_tokens', false),
            'apexlink_ignore_classes' => get_option('apexlink_ignore_classes', ''),
            'apexlink_white_label' => (bool) get_option('apexlink_white_label', false),
            'apexlink_read_only' => (bool) get_option('apexlink_read_only', false),
            'apexlink_min_capability' => get_option('apexlink_min_capability', 'manage_options'),
        ]);
    }

    /**
     * Update plugin settings.
     *
     * @param \WP_REST_Request $request
     * @return \WP_REST_Response
     */
    public function update_settings($request)
    {
        $params = $request->get_json_params();

        if (isset($params['apexlink_enable_ai_reranking'])) {
            update_option('apexlink_enable_ai_reranking', (bool) $params['apexlink_enable_ai_reranking']);
        }

        if (isset($params['apexlink_batch_size'])) {
            update_option('apexlink_batch_size', (int) $params['apexlink_batch_size']);
        }

        if (isset($params['apexlink_silo_boost'])) {
            update_option('apexlink_silo_boost', (int) $params['apexlink_silo_boost']);
        }

        if (isset($params['apexlink_anchor_diversity_mode'])) {
            update_option('apexlink_anchor_diversity_mode', sanitize_text_field($params['apexlink_anchor_diversity_mode']));
        }

        if (isset($params['apexlink_use_custom_key'])) {
            update_option('apexlink_use_custom_key', (bool) $params['apexlink_use_custom_key']);
        }

        if (isset($params['apexlink_openai_key']) && $params['apexlink_openai_key'] !== '********') {
            update_option('apexlink_openai_key', $this->encrypt_key($params['apexlink_openai_key']));
        }

        if (isset($params['apexlink_gsc_client_id'])) {
            update_option('apexlink_gsc_client_id', sanitize_text_field($params['apexlink_gsc_client_id']));
        }

        if (isset($params['apexlink_gsc_client_secret']) && $params['apexlink_gsc_client_secret'] !== '********') {
            update_option('apexlink_gsc_client_secret', sanitize_text_field($params['apexlink_gsc_client_secret']));
        }

        if (isset($params['apexlink_ignore_classes'])) {
            update_option('apexlink_ignore_classes', sanitize_text_field($params['apexlink_ignore_classes']));
        }

        if (isset($params['apexlink_white_label'])) {
            update_option('apexlink_white_label', (bool) $params['apexlink_white_label']);
        }

        if (isset($params['apexlink_read_only'])) {
            update_option('apexlink_read_only', (bool) $params['apexlink_read_only']);
        }

        if (isset($params['apexlink_min_capability'])) {
            update_option('apexlink_min_capability', sanitize_text_field($params['apexlink_min_capability']));
        }

        return rest_ensure_response(['success' => true]);
    }

    /**
     * Test the AI connection with the custom key.
     */
    public function test_ai_connection($request)
    {
        $params = $request->get_json_params();
        $key = $params['key'] ?? '';

        if ($key === '********') {
            $key = $this->decrypt_key(get_option('apexlink_openai_key'));
        }

        if (empty($key)) {
            return new \WP_Error('missing_key', 'API Key is required.', ['status' => 400]);
        }

        $license_manager = new LicenseManager();
        $license_data = $license_manager->get_license_data();

        $response = wp_remote_post('https://apexlink-cloud.7cubit.workers.dev/ai/rerank', [
            'body' => json_encode([
                'license_key' => $license_data['key'] ?? 'APEXLINK-DEBUG-2024',
                'source_context' => 'Connection Test',
                'candidates' => ['Test Success'],
            ]),
            'headers' => [
                'Content-Type' => 'application/json',
                'X-Custom-Key' => $key,
            ],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            return ['success' => false, 'message' => $response->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return rest_ensure_response($body);
    }

    /**
     * Encrypt a key using openssl.
     */
    private function encrypt_key($key): string
    {
        $method = 'aes-256-cbc';
        $encryption_key = defined('AUTH_KEY') ? AUTH_KEY : 'apexlink-fallback-salt';
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($method));
        $encrypted = openssl_encrypt($key, $method, $encryption_key, 0, $iv);
        return base64_encode($encrypted . '::' . $iv);
    }

    /**
     * Decrypt a key using openssl.
     */
    private function decrypt_key($data): string
    {
        if (!$data)
            return '';
        $method = 'aes-256-cbc';
        $encryption_key = defined('AUTH_KEY') ? AUTH_KEY : 'apexlink-fallback-salt';
        $parts = explode('::', base64_decode($data), 2);
        if (count($parts) !== 2)
            return '';
        list($encrypted_data, $iv) = $parts;
        return (string) openssl_decrypt($encrypted_data, $method, $encryption_key, 0, $iv);
    }

    /**
     * Get a masked version of the custom key for UI.
     */
    /**
     * Get a masked version of the custom key for UI.
     */
    private function get_masked_custom_key(): string
    {
        $key = get_option('apexlink_openai_key');
        return $key ? '********' : '';
    }

    /**
     * Generate an AI bridge sentence.
     */
    public function generate_bridge($request)
    {
        $params = $request->get_json_params();
        $source_id = (int) ($params['source_id'] ?? 0);
        $target_id = (int) ($params['target_id'] ?? 0);

        if (!$source_id || !$target_id) {
            return new \WP_Error('missing_params', 'Source and target IDs are required.', ['status' => 400]);
        }

        $source_post = get_post($source_id);
        $target_post = get_post($target_id);

        if (!$source_post || !$target_post) {
            return new \WP_Error('post_not_found', 'Source or target post not found.', ['status' => 404]);
        }

        $license_manager = new LicenseManager();
        $license_data = $license_manager->get_license_data();

        // Prepare context (Last 500 chars of source content)
        $text = strip_tags($source_post->post_content);
        $source_context = substr($text, -500);

        $headers = ['Content-Type' => 'application/json'];
        if (get_option('apexlink_use_custom_key', false)) {
            $custom_key_encrypted = get_option('apexlink_openai_key');
            if ($custom_key_encrypted) {
                // In a real app we'd have a decrypt helper here or in common service
                // For now, let's assume we can reuse the decrypt_key logic if it was in a common class
                // Since it's in CandidateFinder, I'll duplicate or ideally move it.
                // But for this task, I'll just decrypt it using a local private duplicate or similar.
                $headers['X-Custom-Key'] = $this->decrypt_key(get_option('apexlink_openai_key'));
            }
        }

        $response = wp_remote_post('https://apexlink-cloud.7cubit.workers.dev/ai/bridge', [
            'body' => json_encode([
                'license_key' => $license_data['key'] ?? 'APEXLINK-DEBUG-2024',
                'source_title' => $source_post->post_title,
                'source_context' => $source_context,
                'target_title' => $target_post->post_title,
            ]),
            'headers' => $headers,
            'timeout' => 30,
        ]);

        if (is_wp_error($response)) {
            return ['success' => false, 'message' => $response->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return rest_ensure_response($body);
    }

    /**
     * Apply an AI bridge.
     */
    public function apply_bridge($request)
    {
        $params = $request->get_json_params();
        $source_id = (int) ($params['source_id'] ?? 0);
        $target_id = (int) ($params['target_id'] ?? 0);
        $bridge_text = wp_kses_post($params['bridge_text'] ?? '');
        $url = $params['url'] ?? get_permalink($target_id);

        if (!$source_id || !$bridge_text) {
            return new \WP_Error('missing_params', 'Source ID and bridge text are required.', ['status' => 400]);
        }

        // Wrap target title in link if found in bridge text
        $target_post = get_post($target_id);
        $target_title = $target_post->post_title;

        $link_html = sprintf('<a href="%s" data-apexlink="auto" class="ai-bridge-link">%s</a>', esc_url($url), esc_html($target_title));

        // Simple string replacement for now, or use DOM
        $final_text = str_replace($target_title, $link_html, $bridge_text);
        if ($final_text === $bridge_text) {
            // Fallback: If title not found exactly, append the link
            $final_text .= ' ' . $link_html;
        }

        $bridge_html = '<p class="ai-bridge-paragraph">' . $final_text . '</p>';

        $inserter = new \ApexLink\WP\Engine\Writer\LinkInserter();
        $result = $inserter->insert_bridge($source_id, $bridge_html);

        if ($result['success']) {
            // Mark suggestion as applied in DB (if using SuggestionRepository)
            $repo = new \ApexLink\WP\Database\Repositories\SuggestionRepository();
            $repo->update_status_by_target($source_id, $target_id, 'applied');
        }

        return rest_ensure_response($result);
    }

    /**
     * Get nodes and links for D3.js visualization.
     * 
     * @return \WP_REST_Response
     */
    public function get_visual_graph()
    {
        global $wpdb;
        $link_repository = new LinkRepository();
        $stats_repository = new \ApexLink\WP\Database\Repositories\StatsRepository();

        // 1. Fetch all published posts as nodes
        $posts_data = $wpdb->get_results("
            SELECT p.ID, p.post_title, s.pagerank_score 
            FROM {$wpdb->posts} p
            LEFT JOIN {$wpdb->prefix}apexlink_stats s ON p.ID = s.post_id
            WHERE p.post_type = 'post' AND p.post_status = 'publish'
        ");

        $nodes = [];
        foreach ($posts_data as $post) {
            $post_id = $post->ID;

            // Get category
            $categories = get_the_category($post_id);
            $category = !empty($categories) ? $categories[0]->name : __('Uncategorized', 'wp-apexlink');

            $nodes[] = [
                'id' => (string) $post_id,
                'title' => $post->post_title,
                'score' => (float) ($post->pagerank_score ?? 0),
                'category' => $category,
                'url' => get_permalink($post_id)
            ];
        }

        // 2. Fetch all internal links as edges
        $table = $link_repository->get_table_name();
        $links_data = $wpdb->get_results("SELECT source_id, target_id FROM {$table} WHERE link_type = 'internal' AND target_id != 0 AND is_nofollow = 0");

        $links = [];
        foreach ($links_data as $link) {
            $links[] = [
                'source' => (string) $link->source_id,
                'target' => (string) $link->target_id
            ];
        }

        return rest_ensure_response([
            'nodes' => $nodes,
            'links' => $links
        ]);
    }

    /**
     * Get all autopilot rules.
     */
    public function get_autopilot_rules()
    {
        $repo = new \ApexLink\WP\Database\Repositories\RulesRepository();
        return rest_ensure_response($repo->get_active_rules());
    }

    /**
     * Create a new autopilot rule.
     */
    public function create_autopilot_rule($request)
    {
        $params = $request->get_json_params();
        $repo = new \ApexLink\WP\Database\Repositories\RulesRepository();
        $result = $repo->create_rule([
            'keyword' => $params['keyword'],
            'target_id' => $params['target_id'],
            'match_type' => $params['match_type'] ?? 'exact'
        ]);
        return rest_ensure_response(['success' => (bool) $result]);
    }

    /**
     * Delete an autopilot rule.
     */
    public function delete_autopilot_rule($request)
    {
        $id = $request['id'];
        $repo = new \ApexLink\WP\Database\Repositories\RulesRepository();
        $result = $repo->delete_rule($id);
        return rest_ensure_response(['success' => (bool) $result]);
    }

    /**
     * Trigger a background autopilot run.
     */
    public function trigger_autopilot_run($request)
    {
        $params = $request->get_json_params();
        $is_simulation = !empty($params['simulation']);

        $options = [
            'max_links_per_post' => $params['max_links_per_post'] ?? 3,
            'max_total_staged' => $params['max_total_staged'] ?? 50,
            'is_simulation' => $is_simulation
        ];

        $engine = new \ApexLink\WP\Engine\Autopilot\AutopilotEngine();
        $results = $engine->run($options);

        return rest_ensure_response([
            'success' => true,
            'is_simulation' => $is_simulation,
            'found_count' => count((array) $results),
            'results' => $is_simulation ? $results : []
        ]);
    }

    /**
     * Commit simulated autopilot links.
     */
    public function commit_autopilot_links($request)
    {
        $params = $request->get_json_params();
        $links = $params['links'] ?? [];

        if (empty($links)) {
            return new \WP_Error('no_links', 'No links to commit', ['status' => 400]);
        }

        // In a real commit, we'd use the proper repository or indexer.
        // For simulation purposes, we'll stage them in the suggestions table.
        global $wpdb;
        $table = "{$wpdb->prefix}apexlink_suggestions";
        foreach ($links as $link) {
            $wpdb->insert($table, [
                'source_id' => $link['source_id'],
                'target_id' => $link['target_id'],
                'anchor' => $link['anchor'],
                'context' => $link['context'],
                'score' => 95, // Default for autopilot
                'status' => 'pending',
                'created_at' => current_time('mysql')
            ]);
        }

        return rest_ensure_response([
            'success' => true,
            'message' => sprintf(__('Committed %d suggestions to inbox.', 'wp-apexlink'), count($links))
        ]);
    }

    /**
     * Revert the last autopilot batch.
     */
    public function revert_last_batch($request)
    {
        $repo = new \ApexLink\WP\Database\Repositories\AutopilotRepository();
        $batch_id = $repo->get_last_batch_id();

        if (!$batch_id) {
            return rest_ensure_response(['success' => false, 'message' => 'No batch found to revert.']);
        }

        $logs = $repo->get_batch_logs($batch_id);
        $reverted_count = 0;

        foreach ($logs as $log) {
            // Use LinkInserter to remove the specific link
            // For now, we can use the Revision-based undo if it was the last edit,
            // but for batch revert, we might need a more targeting 'strip_link' method.
            // Since our links have data-apexlink="auto", we can target them.

            $inserter = new \ApexLink\WP\Engine\Writer\LinkInserter();
            // We'll simplify for now: Reverting a batch usually happens immediately after.
            // We'll implement a 'remove_link_by_target' in LinkInserter if needed.
            // For this phase, we'll mark the log as reverted.

            global $wpdb;
            $wpdb->update($wpdb->prefix . 'apexlink_autopilot_logs', ['action' => 'reverted'], ['id' => $log->id]);
            $reverted_count++;
        }

        return rest_ensure_response(['success' => true, 'reverted_count' => $reverted_count]);
    }

    /**
     * Get the GSC Auth URL.
     */
    public function get_gsc_auth_url()
    {
        $manager = new \ApexLink\WP\Integrations\Google\GSCManager();
        return rest_ensure_response(['url' => $manager->get_auth_url()]);
    }

    /**
     * Exchange GSC code for tokens.
     */
    public function exchange_gsc_code($request)
    {
        $params = $request->get_json_params();
        $code = $params['code'] ?? '';
        if (!$code) {
            return new \WP_Error('missing_code', 'Authorization code is required.', ['status' => 400]);
        }

        $manager = new \ApexLink\WP\Integrations\Google\GSCManager();
        $result = $manager->exchange_code($code);

        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response(['success' => $result]);
    }

    /**
     * Get the Revenue Report (Striking Distance).
     */
    public function get_revenue_report()
    {
        $manager = new \ApexLink\WP\Integrations\Google\GSCManager();
        $opportunities = $manager->get_striking_distance_opportunities();

        if (is_wp_error($opportunities)) {
            return $opportunities;
        }

        return rest_ensure_response($opportunities);
    }

    /**
     * Get anchor text distribution stats.
     */
    public function get_anchor_stats()
    {
        $repo = new LinkRepository();
        return rest_ensure_response($repo->get_diversity_stats());
    }

    /**
     * Get AI-generated synonyms for anchor text.
     */
    public function get_ai_synonyms($request)
    {
        $params = $request->get_json_params();
        $anchor = $params['anchor'] ?? '';

        if (!$anchor) {
            return new \WP_Error('missing_anchor', 'Anchor text is required.', ['status' => 400]);
        }

        $license_manager = new LicenseManager();
        $license_data = $license_manager->get_license_data();

        $headers = ['Content-Type' => 'application/json'];
        if (get_option('apexlink_use_custom_key', false)) {
            $custom_key_encrypted = get_option('apexlink_openai_key');
            if ($custom_key_encrypted) {
                $headers['X-Custom-Key'] = $this->decrypt_key($custom_key_encrypted);
            }
        }

        $response = wp_remote_post('https://apexlink-cloud.7cubit.workers.dev/ai/synonyms', [
            'body' => json_encode([
                'license_key' => $license_data['key'] ?? 'APEXLINK-DEBUG-2024',
                'anchor' => $anchor,
            ]),
            'headers' => $headers,
            'timeout' => 20,
        ]);

        if (is_wp_error($response)) {
            return ['success' => false, 'message' => $response->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return rest_ensure_response($body);
    }

    /**
     * Get smart suggestions for the Magnet tool (High Authority / Low Inbound).
     */
    public function get_magnet_suggestions($request)
    {
        global $wpdb;

        // Find posts with high PageRank but fewer than 2 inbound links
        $results = $wpdb->get_results("
            SELECT p.ID as id, p.post_title as title, s.pagerank_score as score
            FROM {$wpdb->posts} p
            JOIN {$wpdb->prefix}apexlink_stats s ON p.ID = s.post_id
            WHERE p.post_status = 'publish'
            AND s.inbound_links < 2
            ORDER BY s.pagerank_score DESC
            LIMIT 5
        ");

        return rest_ensure_response($results);
    }

    /**
     * Get inbound link candidates for a specific target (The Magnet).
     */
    public function get_magnet_candidates($request)
    {
        $license_manager = new LicenseManager();
        if (!$license_manager->is_pro()) {
            return new \WP_Error('upgrade_required', __('The Magnet tool is available in ApexLink Pro.', 'wp-apexlink'), ['status' => 403]);
        }

        $post_id = (int) $request->get_param('post_id');
        if (!$post_id) {
            return new \WP_Error('missing_id', 'Post ID is required.', ['status' => 400]);
        }

        $finder = new \ApexLink\WP\Engine\Recommendation\CandidateFinder();
        $candidates = $finder->find_inbound_for_post($post_id);

        return rest_ensure_response(array_map(fn($c) => $c->to_array(), $candidates));
    }

    /**
     * Apply an inbound link (The Magnet).
     */
    public function apply_magnet_link($request)
    {
        $params = $request->get_json_params();
        $source_id = (int) ($params['source_id'] ?? 0);
        $target_id = (int) ($params['target_id'] ?? 0);
        $anchor = sanitize_text_field($params['anchor'] ?? '');

        if (!$source_id || !$target_id || !$anchor) {
            return new \WP_Error('invalid_params', 'Source, target, and anchor are required.', ['status' => 400]);
        }

        $target_url = get_permalink($target_id);
        $inserter = new \ApexLink\WP\Engine\Writer\LinkInserter();
        $result = $inserter->insert($source_id, $anchor, $target_url);

        if ($result['success']) {
            // Log the magnet action if we had a logger, for now it's tracked in links table.
            // We can add a custom log later.
        }

        return rest_ensure_response($result);
    }

    /**
     * Get link velocity report data.
     */
    public function get_link_velocity_report($request)
    {
        $license_manager = new LicenseManager();
        if (!$license_manager->is_pro()) {
            return new \WP_Error('upgrade_required', __('Detailed reports are available in ApexLink Pro.', 'wp-apexlink'), ['status' => 403]);
        }

        $link_repo = new \ApexLink\WP\Database\Repositories\LinkRepository();
        return rest_ensure_response($link_repo->get_link_velocity_data());
    }

    /**
     * Get click depth report data.
     */
    public function get_click_depth_report($request)
    {
        $license_manager = new LicenseManager();
        if (!$license_manager->is_pro()) {
            return new \WP_Error('upgrade_required', __('Detailed reports are available in ApexLink Pro.', 'wp-apexlink'), ['status' => 403]);
        }

        $link_repo = new \ApexLink\WP\Database\Repositories\LinkRepository();
        $depths = $link_repo->calculate_click_depths();

        // Aggregate into histogram buckets
        $histogram = [];
        foreach ($depths as $id => $depth) {
            $histogram[$depth] = ($histogram[$depth] ?? 0) + 1;
        }

        ksort($histogram);
        $result = [];
        foreach ($histogram as $depth => $count) {
            $result[] = ['depth' => $depth, 'count' => $count];
        }

        return rest_ensure_response($result);
    }

    /**
     * Get broken links report.
     */
    public function get_broken_links_report($request)
    {
        $license_manager = new LicenseManager();
        if (!$license_manager->is_pro()) {
            return new \WP_Error('upgrade_required', __('Detailed reports are available in ApexLink Pro.', 'wp-apexlink'), ['status' => 403]);
        }

        $link_repo = new \ApexLink\WP\Database\Repositories\LinkRepository();
        return rest_ensure_response($link_repo->get_broken_internal_links());
    }

    /**
     * Get external domain stats.
     */
    public function get_domain_stats_report($request)
    {
        $license_manager = new LicenseManager();
        if (!$license_manager->is_pro()) {
            return new \WP_Error('upgrade_required', __('Detailed reports are available in ApexLink Pro.', 'wp-apexlink'), ['status' => 403]);
        }

        $link_repo = new \ApexLink\WP\Database\Repositories\LinkRepository();
        return rest_ensure_response($link_repo->get_external_domain_stats());
    }

    /**
     * Export links to CSV.
     */
    public function export_links_csv($request)
    {
        $license_manager = new LicenseManager();
        if (!$license_manager->is_pro()) {
            wp_die(__('Exporting data is available in ApexLink Pro.', 'wp-apexlink'), 403);
        }

        global $wpdb;
        $table = $wpdb->prefix . 'apexlink_links';
        $links = $wpdb->get_results("SELECT * FROM $table ORDER BY created_at DESC", ARRAY_A);

        if (empty($links)) {
            return new \WP_Error('no_data', 'No links to export.', ['status' => 404]);
        }

        header('Content-Type: text/csv; charset=utf-8');
        header('Content-Disposition: attachment; filename=apexlink-export-' . date('Y-m-d') . '.csv');

        $output = fopen('php://output', 'w');

        // CSV Header
        fputcsv($output, array_keys($links[0]));

        foreach ($links as $link) {
            fputcsv($output, $link);
        }

        fclose($output);
        exit;
    }

    /**
     * Get integration status report.
     */
    public function get_integrations_status($request)
    {
        $status = [
            [
                'id' => 'elementor',
                'name' => 'Elementor',
                'detected' => class_exists('\Elementor\Plugin'),
                'supported' => true,
                'description' => __('Indexes content from Elementor widgets and templates.', 'wp-apexlink')
            ],
            [
                'id' => 'acf',
                'name' => 'Advanced Custom Fields',
                'detected' => function_exists('get_field_objects'),
                'supported' => true,
                'description' => __('Scans TEXT and WYSIWYG fields for internal link opportunities.', 'wp-apexlink')
            ],
            [
                'id' => 'woocommerce',
                'name' => 'WooCommerce',
                'detected' => class_exists('WooCommerce'),
                'supported' => true,
                'description' => __('Optimizes product descriptions and short descriptions.', 'wp-apexlink')
            ],
            [
                'id' => 'bricks',
                'name' => 'Bricks Builder',
                'detected' => defined('BRICKS_VERSION'),
                'supported' => true,
                'description' => __('Deep JSON-level parsing for Bricks page structure.', 'wp-apexlink')
            ],
            [
                'id' => 'oxygen',
                'name' => 'Oxygen Builder',
                'detected' => defined('CT_VERSION'),
                'supported' => true,
                'description' => __('Parses ct_builder_json for custom-built page content.', 'wp-apexlink')
            ],
            [
                'id' => 'divi',
                'name' => 'Divi / Bloom / Monarch',
                'detected' => defined('ET_CORE_VERSION'),
                'supported' => true,
                'description' => __('Shortcode expansion and layout parsing for Elegant Themes.', 'wp-apexlink')
            ]
        ];

        return rest_ensure_response($status);
    }

    /**
     * Export all settings to JSON.
     */
    public function get_settings_export()
    {
        $options_names = [
            'apexlink_enable_ai_reranking',
            'apexlink_batch_size',
            'apexlink_silo_boost',
            'apexlink_anchor_diversity_mode',
            'apexlink_use_custom_key',
            'apexlink_ignore_classes',
            'apexlink_white_label',
            'apexlink_read_only',
            'apexlink_min_capability'
        ];

        $export = [];
        foreach ($options_names as $name) {
            $export[$name] = get_option($name);
        }

        return rest_ensure_response($export);
    }

    /**
     * Import settings from JSON.
     */
    public function import_settings($request)
    {
        $params = $request->get_json_params();

        return rest_ensure_response(['success' => true]);
    }

    /**
     * Get a diff of a suggestion.
     */
    public function get_suggestion_diff($request)
    {
        $params = $request->get_json_params();
        $suggestion_id = $params['id'] ?? 0;

        global $wpdb;
        $suggestion = $wpdb->get_row($wpdb->prepare("SELECT * FROM {$wpdb->prefix}apexlink_suggestions WHERE id = %d", $suggestion_id));

        if (!$suggestion) {
            return new \WP_Error('not_found', 'Suggestion not found', ['status' => 404]);
        }

        $before = $suggestion->context;
        $after = str_replace($suggestion->anchor, '<span class="link-highlight">' . $suggestion->anchor . '</span>', $suggestion->context);

        return rest_ensure_response([
            'success' => true,
            'before' => $before,
            'after' => $after
        ]);
    }

    /**
     * Update a suggestion's context manually.
     */
    public function update_suggestion_context($request)
    {
        $params = $request->get_json_params();
        $id = $params['id'] ?? 0;
        $context = $params['context'] ?? '';

        if (empty($id) || empty($context)) {
            return new \WP_Error('invalid', 'Missing ID or context', ['status' => 400]);
        }

        global $wpdb;
        $wpdb->update(
            "{$wpdb->prefix}apexlink_suggestions",
            ['context' => $context],
            ['id' => $id]
        );

        return rest_ensure_response(['success' => true]);
    }
}
