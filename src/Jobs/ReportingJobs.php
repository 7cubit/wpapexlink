<?php

namespace ApexLink\WP\Jobs;

use ApexLink\WP\Database\Repositories\LinkRepository;

/**
 * Scheduled jobs for the Reporting Suite.
 */
class ReportingJobs
{

	/**
	 * Initialize the jobs.
	 */
	public static function init()
	{
		add_action('apexlink_check_broken_links', [self::class, 'check_broken_links']);
		add_action('apexlink_send_weekly_summary', [self::class, 'send_weekly_summary']);

		add_action('init', [self::class, 'schedule_jobs']);
	}

	/**
	 * Schedule recurring jobs.
	 */
	public static function schedule_jobs()
	{
		if (!function_exists('as_next_scheduled_action')) {
			return;
		}

		if (!as_next_scheduled_action('apexlink_check_broken_links')) {
			as_schedule_recurring_action(time(), DAY_IN_SECONDS, 'apexlink_check_broken_links');
		}

		if (!as_next_scheduled_action('apexlink_send_weekly_summary')) {
			as_schedule_recurring_action(time(), WEEK_IN_SECONDS, 'apexlink_send_weekly_summary');
		}
	}

	/**
	 * Check for broken internal links using HEAD requests.
	 */
	public static function check_broken_links()
	{
		global $wpdb;
		$link_repo = new LinkRepository();
		$links = $wpdb->get_results("SELECT * FROM {$link_repo->get_table_name()} WHERE link_type = 'internal' AND target_id = 0", ARRAY_A);

		foreach ($links as $link) {
			$response = wp_remote_head($link['url'], ['timeout' => 5]);
			$code = wp_remote_retrieve_response_code($response);

			if (is_wp_error($response) || $code >= 400) {
				// Mark as broken or log for the report
				// For now, our reporting query handles it by checking if target_id exists.
				// But for custom URLs (target_id=0), we should verify manually.
			}
		}
	}

	/**
	 * Send weekly email summary to admin.
	 */
	public static function send_weekly_summary()
	{
		$to = get_option('admin_email');
		$subject = '[ApexLink] Weekly SEO Architecture Report';

		$link_repo = new LinkRepository();
		$velocity = $link_repo->get_link_velocity_data();
		$broken = $link_repo->get_broken_internal_links();

		$total_links = array_sum(array_column($velocity, 'count'));
		$broken_count = count($broken);

		$message = "
			<html>
			<body style='font-family: sans-serif; color: #333;'>
				<h2 style='color: #4f46e5;'>Your Weekly ApexLink Summary</h2>
				<p>Here is how your site's neural architecture performed this week:</p>
				<table style='width: 100%; border-collapse: collapse;'>
					<tr>
						<td style='padding: 10px; border: 1px solid #ddd;'><strong>Total Internal Links Created (30d)</strong></td>
						<td style='padding: 10px; border: 1px solid #ddd;'>{$total_links}</td>
					</tr>
					<tr>
						<td style='padding: 10px; border: 1px solid #ddd;'><strong>Broken Links Found</strong></td>
						<td style='padding: 10px; border: 1px solid #ddd; color: " . ($broken_count > 0 ? 'red' : 'green') . ";'>{$broken_count}</td>
					</tr>
				</table>
				<p>Log in to your WordPress dashboard to view the full Reporting Suite.</p>
				<hr>
				<p style='font-size: 10px; color: #999;'>Sent automatically by ApexLink AI.</p>
			</body>
			</html>
		";

		add_filter('wp_mail_content_type', function () {
			return 'text/html'; });
		wp_mail($to, $subject, $message);
	}
}
