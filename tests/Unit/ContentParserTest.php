<?php

namespace NeuroLink\WP\Tests\Unit;

use PHPUnit\Framework\TestCase;
use NeuroLink\WP\Engine\Analysis\ContentParser;

/**
 * Unit tests for ContentParser.
 */
class ContentParserTest extends TestCase {

	/**
	 * Test stripping noise.
	 */
	public function test_strip_noise() {
		$parser = new ContentParser();
		$html = '<div><script>alert("hi");</script><h1>Hello</h1><style>.blue { color: blue; }</style><footer>Footer</footer></div>';
		
		$clean = $parser->strip_noise( $html );
		
		$this->assertStringContainsString( '<h1>Hello</h1>', $clean );
		$this->assertStringNotContainsString( '<script>', $clean );
		$this->assertStringNotContainsString( '<style>', $clean );
		$this->assertStringNotContainsString( '<footer>', $clean );
	}

	/**
	 * Test extracting text.
	 */
	public function test_extract_text() {
		$parser = new ContentParser();
		$html = '<h1>  Hello </h1><p>World.  </p>';
		
		$text = $parser->extract_text( $html );
		
		$this->assertEquals( 'Hello World.', $text );
	}
}
