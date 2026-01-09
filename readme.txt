=== WP ApexLink ===
Contributors: apexlink
Tags: internal linking, seo, auto-linking, link building, ai content
Requires at least: 6.0
Tested up to: 6.4
Stable tag: 1.0.0
Requires PHP: 7.4
License: GPLv2 or later
License URI: http://www.gnu.org/licenses/gpl-2.0.html

WP ApexLink is the AI-powered internal linking engine that boosts your SEO by automatically building smart, context-aware links between your posts.

== Description ==

**WP ApexLink** (formerly WP NeuroLink) is the next generation of internal linking for WordPress. It uses advanced Natural Language Processing (NLP) and a hybrid AI architecture to analyze your content and find the *perfect* internal linking opportunities that you missed.

Stop manually searching for old posts to link to. Let ApexLink's "Autopilot" and "Suggestion Inbox" do the heavy lifting for you.

### 🚀 Key Features

*   **AI-Powered Suggestions**: Finds relevant link opportunities based on semantic context, not just simple keyword matching.
*   **Visual Link Graph**: Visualize your site's architecture with an interactive D3.js force-directed graph. Identify "Orphan Posts" and clusters instantly.
*   **Autopilot (Pro)**: Automatically insert links as you write, or run bulk linking jobs in the background.
*   **Revenue Flow (Pro)**: Integrate with Google Search Console to prioritize links to pages that are within "Striking Distance" of ranking #1.
*   **The Magnet (Pro)**: Reverse linking tool. Select a target post and find all other posts that *should* be linking to it.
*   **Safe Writer Engine**: Injects links directly into your HTML content without breaking shortcodes, scripts, or page builders (Elementor, Divi, Beaver Builder supported).
*   **Detailed Reporting**: Track your "Link Velocity", "Click Depth", and "Anchor Text Diversity".

### 💡 Why Internal Linking Matters?

Internal links are the highways of your website. They help Google crawl your site, pass authority (PageRank) to important pages, and keep visitors engaged longer. 

WP ApexLink makes building these highways effortless.

== Installation ==

1.  Upload the `wp-apexlink` folder to the `/wp-content/plugins/` directory.
2.  Activate the plugin through the 'Plugins' menu in WordPress.
3.  Go to **ApexLink > Settings** to configure your indexing preferences.
4.  Run the "Initial Index" wizard to let AI analyze your site.

== Frequently Asked Questions ==

= Does this work with Elementor or Divi? =
Yes! We have a specialized "Page Builder Compatibility" layer that parses content from Elementor widgets, Divi shortcodes, and even ACF fields.

= Will this slow down my site? =
No. ApexLink performs all its heavy analysis in the background using the Action Scheduler (asynchronous processing). It does NOT scan your database on every page load.

= Can I review links before they are published? =
Absolutely. The "Suggestions Inbox" allows you to approve, reject, or edit every single link before it goes live. You are always in control.

== Screenshots ==

1. **Dashboard Overview** - See your site's health at a glance.
2. **Visual Graph** - Explore your internal link structure.
3. **Suggestions Inbox** - Review and approve AI-suggested links.
4. **The Magnet** - Pull links to your most profitable pages.

== Changelog ==

= 1.0.0 =
*   Initial release.
*   Rebranded from NeuroLink to ApexLink.
*   Added "Revenue Report" with GSC integration.
*   Added "Magnet" reverse linking tool.
