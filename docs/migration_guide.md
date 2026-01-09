# Migrating from Link Whisper to WP ApexLink

Welcome to **WP ApexLink**! If you're coming from Link Whisper, you're making a great choice for a more accurate, AI-driven internal linking strategy.

This guide will help you understand the differences and how to make the switch smoothly.

## Key Differences

| Feature | Link Whisper | WP ApexLink |
| :--- | :--- | :--- |
| **Analysis Engine** | Keyword Matching | Hybrid Semantic AI + NLP |
| **Link Insertion** | Standard WordPress Filter | Safe Writer DOM Injection (HTML5) |
| **Page Builders** | Limited Support | Native Parsing (Elementor, Divi, ACF, Oxygen) |
| **Data Storage** | Custom Tables | Optimized Custom Tables + Object Caching |
| **Visuals** | Basic Stats | Interactive Force-Directed Graph |

## Migration Steps

1.  **Deactivate Link Whisper**: To avoid conflicts, we recommend deactivating Link Whisper before running the initial ApexLink index. You do *not* need to uninstall it immediately.
2.  **Install & Activate ApexLink**: accurate indexing requires a fresh look at your content.
3.  **Run the Setup Wizard**: Go to **ApexLink > Overview** and follow the onboarding tour.
4.  **Initial Index**: Let ApexLink scan your content. This might take a few minutes depending on your site size (approx. 50 posts/minute).
5.  **Review "Orphans"**: ApexLink's definition of an "Orphan" is stricter. We check for *internal* inbound links from other posts.
6.  **Check "Suggestions"**: You will likely see fewer, but *higher quality* suggestions compared to Link Whisper because we filter out irrelevant matches using AI.

## Handling Existing Links

ApexLink **does not** touch links created by Link Whisper (or any other plugin) unless you explicitly tell it to via the "Magnet" tool or manually editing a post.

*   **Link Whisper Links**: These are treated as standard hard-coded links in your content. ApexLink will see them, index them, and count them in your reports.
*   **Broken Links**: ApexLink's "Reports" section will identify any broken links Link Whisper might have left behind.

## Need Help?

If you have custom post types or specific configurations, check the **Settings > Advanced** tab to include/exclude them from the index.
