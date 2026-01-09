# Technical Design Document: WP NeuroLink

## 1. Overview
WP NeuroLink is a "Neural Architecture Engine" for WordPress designed to automate internal linking through semantic analysis and generative AI "Bridge" insertion.

## 2. Core Architecture
The plugin follows a **Hybrid-Edge** architecture:
- **The Cortex (Local)**: Handles indexing, document parsing, and local graph math using a custom SQL table `wp_neurolink_index`.
- **The NeuroCloud (Middleware)**: Proxies AI requests, handles licensing, and protects prompt integrity.
- **The Intelligence (AI)**: Integrates with OpenAI (GPT-4o-mini), Perplexity, and Gemini 1.5 Pro.

## 3. Tech Stack
- **Backend**: PHP 8.1+, Composer (PSR-4), Action Scheduler.
- **Frontend**: React 18, TailwindCSS (Scoped), D3.js (for Brain visualization).
- **Communication**: Guzzle (REST), WordPress Background Processing.

## 4. Key Components
- **Engine/Analysis**: Processes text into tokens and stems.
- **Engine/Graph**: Calculates node weight and link relevance.
- **Engine/Inserter**: Safely modifies the DOM to inject "Semantic Bridges".

## 5. Coding Standards
- **Namespace**: `NeuroLink\WP`
- **Pattern**: Singleton (Main), Dependency Injection (Core Services).
- **Styling**: Scoped Tailwind `.wp-neurolink-admin`.
