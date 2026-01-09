<?php

namespace ApexLink\WP\License;

defined('ABSPATH') || exit;

use ApexLink\WP\Core\Logger;

class LicenseManager
{
    private const OPTION_KEY = 'apexlink_license_data';
    private const CLOUD_URL = 'https://apexlink-cloud.7cubit.workers.dev/auth/validate';

    public function activate(string $key): array
    {
        // Normalize key for comparison
        $normalized_key = strtoupper(trim($key));

        // Local bypass for development
        if ($normalized_key === 'APEXLINK-DEBUG-2024') {
            $data = [
                'active' => true,
                'tier' => 'enterprise',
                'expires_at' => '2099-12-31',
                'message' => 'Debug License Active (Local Bypass)',
            ];
            $this->save_license_data($key, $data);
            return ['success' => true, 'data' => $data];
        }

        $response = wp_remote_post(self::CLOUD_URL, [
            'body' => json_encode([
                'license_key' => $key,
                'site_url' => get_site_url(),
            ]),
            'headers' => ['Content-Type' => 'application/json'],
        ]);

        if (is_wp_error($response)) {
            return ['success' => false, 'message' => $response->get_error_message()];
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);

        if (empty($body['active'])) {
            return ['success' => false, 'message' => $body['message'] ?? 'Invalid license'];
        }

        $this->save_license_data($key, $body);

        return ['success' => true, 'data' => $body];
    }

    public function is_active(): bool
    {
        $data = $this->get_license_data();
        if (!$data || empty($data['active'])) {
            return false;
        }

        // Periodically re-validate (e.g., every 24 hours)
        $last_check = $data['last_check'] ?? 0;
        if (time() - $last_check > DAY_IN_SECONDS) {
            $this->activate($data['key']);
        }

        return true;
    }

    private function encrypt(string $data): string
    {
        $method = 'aes-256-cbc';
        $key = defined('AUTH_KEY') ? AUTH_KEY : 'apexlink-fallback-salt';
        $iv = openssl_random_pseudo_bytes(openssl_cipher_iv_length($method));
        $encrypted = openssl_encrypt($data, $method, $key, 0, $iv);
        return base64_encode($encrypted . '::' . $iv);
    }

    private function decrypt(string $data): string
    {
        $method = 'aes-256-cbc';
        $key = defined('AUTH_KEY') ? AUTH_KEY : 'apexlink-fallback-salt';
        $parts = explode('::', base64_decode($data), 2);
        if (count($parts) !== 2) {
            return '';
        }
        list($encrypted_data, $iv) = $parts;
        return (string) openssl_decrypt($encrypted_data, $method, $key, 0, $iv);
    }

    private function save_license_data(string $key, array $data): void
    {
        $data['key'] = $key;
        $data['last_check'] = time();

        $encoded = $this->encrypt(json_encode($data));
        update_option(self::OPTION_KEY, $encoded);
    }

    public function get_license_data(): ?array
    {
        $encoded = get_option(self::OPTION_KEY);
        if (!$encoded) {
            return null;
        }

        // Try decrypting
        $json = $this->decrypt($encoded);
        $data = json_decode($json, true);

        // Fallback for legacy base64 (migration path)
        if (!$data) {
            $data = json_decode(base64_decode($encoded), true);
            if ($data && isset($data['key'])) {
                // Re-save encrypted
                $this->save_license_data($data['key'], $data);
            }
        }

        return $data;
    }

    public function get_credits(): int
    {
        $data = $this->get_license_data();
        if (!$data || empty($data['key'])) {
            return 0;
        }

        // Local bypass for debug key
        if ($data['key'] === 'APEXLINK-DEBUG-2024') {
            return 5000;
        }

        $url = add_query_arg(['license_key' => $data['key']], 'https://apexlink-cloud.7cubit.workers.dev/user/balance');
        $response = wp_remote_get($url);

        if (is_wp_error($response)) {
            return $data['balance'] ?? 0;
        }

        $body = json_decode(wp_remote_retrieve_body($response), true);
        return $body['balance'] ?? 0;
    }

    public function has_credits(): bool
    {
        return $this->get_credits() > 0;
    }

    public function get_plan_limits(): array
    {
        $data = $this->get_license_data();
        $is_pro = !empty($data['active']);

        return [
            'is_pro' => $is_pro,
            'daily_auto_links' => $is_pro ? -1 : 10, // -1 = Unlimited
            'ai_suggestions' => $is_pro ? true : false,
            'detailed_reports' => $is_pro ? true : false,
            'branding_enabled' => $is_pro ? false : true,
            'magnet_tool' => $is_pro ? true : false,
        ];
    }

    public function is_pro(): bool
    {
        $limits = $this->get_plan_limits();
        return $limits['is_pro'];
    }

    public function deactivate(): void
    {
        delete_option(self::OPTION_KEY);
    }
}
