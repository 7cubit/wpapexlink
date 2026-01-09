<?php

namespace NeuroLink\WP\Core;

use Monolog\Logger as Monolog;
use Monolog\Handler\StreamHandler;

/**
 * Wrapper for Monolog.
 */
class Logger {

	/**
	 * Monolog instance.
	 *
	 * @var Monolog
	 */
	private $log;

	/**
	 * Constructor.
	 */
	public function __construct() {
		$upload_dir = wp_upload_dir();
		$log_dir    = $upload_dir['basedir'] . '/neurolink-logs';

		if ( ! file_exists( $log_dir ) ) {
			wp_mkdir_p( $log_dir );
		}

		$this->log = new Monolog( 'neurolink' );
		$this->log->pushHandler( new StreamHandler( $log_dir . '/debug.log', Monolog::DEBUG ) );
	}

	/**
	 * Log info message.
	 *
	 * @param string $message
	 * @param array $context
	 */
	public function info( $message, array $context = [] ) {
		$this->log->info( $message, $context );
	}

	/**
	 * Log error message.
	 *
	 * @param string $message
	 * @param array $context
	 */
	public function error( $message, array $context = [] ) {
		$this->log->error( $message, $context );
	}

	/**
	 * Log warning message.
	 *
	 * @param string $message
	 * @param array $context
	 */
	public function warning( $message, array $context = [] ) {
		$this->log->warning( $message, $context );
	}
}
