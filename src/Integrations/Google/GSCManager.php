<?php

namespace ApexLink\WP\Integrations\Google;

/**
 * Manages Google Search Console integration.
 */
class GSCManager {

    private const CLIENT_ID_OPTION = 'apexlink_gsc_client_id';
    private const CLIENT_SECRET_OPTION = 'apexlink_gsc_client_secret';
    private const TOKEN_OPTION = 'apexlink_gsc_tokens';
    private const TRANSIENT_KEY = 'apexlink_gsc_performance_data';

    /**
     * Get the OAuth authorization URL.
     */
    public function get_auth_url() {
        $client_id = get_option(self::CLIENT_ID_OPTION);
        $redirect_uri = admin_url('admin.php?page=apexlink&path=/revenue-report');

        if (!$client_id) {
            return '';
        }

        $params = [
            'client_id' => $client_id,
            'redirect_uri' => $redirect_uri,
            'response_type' => 'code',
            'scope' => 'https://www.googleapis.com/auth/webmasters.readonly',
            'access_type' => 'offline',
            'prompt' => 'consent'
        ];

        return 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);
    }

    /**
     * Exchange authorization code for tokens.
     */
    public function exchange_code($code) {
        $client_id = get_option(self::CLIENT_ID_OPTION);
        $client_secret = get_option(self::CLIENT_SECRET_OPTION);
        $redirect_uri = admin_url('admin.php?page=apexlink&path=/revenue-report');

        $response = wp_remote_post('https://oauth2.googleapis.com/token', [
            'body' => [
                'code' => $code,
                'client_id' => $client_id,
                'client_secret' => $client_secret,
                'redirect_uri' => $redirect_uri,
                'grant_type' => 'authorization_code',
            ]
        ]);

        if (is_wp_error($response)) {
            return $response;
        }

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($data['access_token'])) {
            $data['expires_at'] = time() + $data['expires_in'];
            update_option(self::TOKEN_OPTION, $data);
            return true;
        }

        return false;
    }

    /**
     * Get a valid access token, refreshing if necessary.
     */
    public function get_access_token() {
        $tokens = get_option(self::TOKEN_OPTION);
        if (!$tokens) return false;

        if (time() > $tokens['expires_at'] - 60) {
            return $this->refresh_token($tokens['refresh_token']);
        }

        return $tokens['access_token'];
    }

    /**
     * Refresh the access token.
     */
    private function refresh_token($refresh_token) {
        $client_id = get_option(self::CLIENT_ID_OPTION);
        $client_secret = get_option(self::CLIENT_SECRET_OPTION);

        $response = wp_remote_post('https://oauth2.googleapis.com/token', [
            'body' => [
                'refresh_token' => $refresh_token,
                'client_id' => $client_id,
                'client_secret' => $client_secret,
                'grant_type' => 'refresh_token',
            ]
        ]);

        if (is_wp_error($response)) return false;

        $data = json_decode(wp_remote_retrieve_body($response), true);
        if (isset($data['access_token'])) {
            $tokens = get_option(self::TOKEN_OPTION);
            $tokens['access_token'] = $data['access_token'];
            $tokens['expires_at'] = time() + $data['expires_in'];
            update_option(self::TOKEN_OPTION, $tokens);
            return $data['access_token'];
        }

        return false;
    }

    /**
     * Fetch performance data from GSC.
     */
    public function fetch_performance_data() {
        $token = $this->get_access_token();
        if (!$token) return false;

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

        if (is_wp_error($response)) return $response;

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
    public function get_striking_distance_opportunities() {
        $data = get_transient(self::TRANSIENT_KEY);
        if (!$data) {
            $data = $this->fetch_performance_data();
        }

        if (!$data || !is_array($data)) return [];

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
