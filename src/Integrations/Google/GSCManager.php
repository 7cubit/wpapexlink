<?php

namespace ApexLink\WP\Integrations\Google;

/**
 * Manages Google Search Console integration via ApexLink Cloud OAuth proxy.
 */
class GSCManager
{

    private const TOKEN_OPTION = 'apexlink_gsc_tokens';
    private const TRANSIENT_KEY = 'apexlink_gsc_performance_data';
    private const CLOUD_BASE_URL = 'https://apexlink-cloud.7cubit.workers.dev';

    /**
     * Get the OAuth initialization URL (redirects to Cloud proxy).
     */
    public function get_connect_url(): string
    {
        $site_url = get_site_url();
        $return_url = admin_url('admin.php?page=wp-apexlink#/settings');

        $params = [
            'site_url' => $site_url,
            'return_url' => $return_url,
        ];

        return self::CLOUD_BASE_URL . '/oauth/google/init?' . http_build_query($params);
    }

    /**
     * Handle callback from cloud proxy with encrypted tokens.
     */
    public function handle_cloud_callback(string $token_data): bool
    {
        if (empty($token_data)) {
            error_log('WP ApexLink GSC: Callback received with empty token_data.');
            return false;
        }

        // Decode the token data from cloud
        $decoded = base64_decode($token_data, true);
        if ($decoded === false) {
            error_log('WP ApexLink GSC: Failed to base64 decode token_data.');
            return false;
        }

        $data = json_decode($decoded, true);

        if (!$data || !isset($data['access_token'])) {
            error_log('WP ApexLink GSC: Invalid JSON or missing access_token in decoded data. Data: ' . print_r($data, true));
            return false;
        }

        // Set expiry time
        $data['expires_at'] = time() + ($data['expires_in'] ?? 3600);

        update_option(self::TOKEN_OPTION, $data);
        error_log('WP ApexLink GSC: Successfully updated GSC tokens.');
        return true;
    }

    /**
     * Check if GSC is connected.
     */
    public function is_connected(): bool
    {
        $tokens = get_option(self::TOKEN_OPTION);
        return !empty($tokens) && isset($tokens['access_token']);
    }

    /**
     * Disconnect GSC.
     */
    public function disconnect(): void
    {
        delete_option(self::TOKEN_OPTION);
        delete_transient(self::TRANSIENT_KEY);
    }

    /**
     * Get a valid access token, refreshing via Cloud proxy if necessary.
     */
    public function get_access_token()
    {
        $tokens = get_option(self::TOKEN_OPTION);
        if (!$tokens || !isset($tokens['access_token'])) {
            return false;
        }

        // Check if token is expired
        if (isset($tokens['expires_at']) && time() > $tokens['expires_at'] - 60) {
            return $this->refresh_token_via_cloud($tokens['refresh_token'] ?? '');
        }

        return $tokens['access_token'];
    }

    /**
     * Refresh the access token via Cloud proxy.
     */
    private function refresh_token_via_cloud(string $refresh_token)
    {
        if (empty($refresh_token)) {
            return false;
        }

        $response = wp_remote_post(self::CLOUD_BASE_URL . '/oauth/google/refresh', [
            'body' => json_encode([
                'refresh_token' => $refresh_token,
                'site_url' => get_site_url(),
            ]),
            'headers' => ['Content-Type' => 'application/json'],
            'timeout' => 15,
        ]);

        if (is_wp_error($response)) {
            return false;
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($data['access_token'])) {
            $tokens = get_option(self::TOKEN_OPTION);
            $tokens['access_token'] = $data['access_token'];
            $tokens['expires_at'] = time() + ($data['expires_in'] ?? 3600);
            update_option(self::TOKEN_OPTION, $tokens);
            return $data['access_token'];
        }

        return false;
    }

    /**
     * Fetch performance data from GSC.
     */
    public function fetch_performance_data()
    {
        $token = $this->get_access_token();
        if (!$token)
            return false;

        $site_url = get_site_url();
        $api_url = 'https://www.googleapis.com/webmasters/v3/sites/' . urlencode($site_url) . '/searchAnalytics/query';

        $body = [
            'startDate' => date('Y-m-d', strtotime('-30 days')),
            'endDate' => date('Y-m-d'),
            'dimensions' => ['query', 'page'],
            'rowLimit' => 1000
        ];

        $response = wp_remote_post($api_url, [
            'headers' => [
                'Authorization' => 'Bearer ' . $token,
                'Content-Type' => 'application/json'
            ],
            'body' => json_encode($body)
        ]);

        if (is_wp_error($response))
            return $response;

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($data['rows'])) {
            set_transient(self::TRANSIENT_KEY, $data['rows'], DAY_IN_SECONDS);
            return $data['rows'];
        }

        return [];
    }

    /**
     * Identify "Striking Distance" opportunities.
     */
    public function get_striking_distance_opportunities()
    {
        $data = get_transient(self::TRANSIENT_KEY);
        if (!$data) {
            $data = $this->fetch_performance_data();
        }

        if (!$data || !is_array($data))
            return [];

        $opportunities = [];
        foreach ($data as $row) {
            $position = $row['position'];
            // Striking distance: average position between 11 and 20 (page 2)
            if ($position >= 10.5 && $position <= 20.5) {
                $opportunities[] = [
                    'query' => $row['keys'][0],
                    'page' => $row['keys'][1],
                    'clicks' => $row['clicks'],
                    'impressions' => $row['impressions'],
                    'position' => round($position, 1)
                ];
            }
        }

        return $opportunities;
    }
}

