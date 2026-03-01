# TTMM (Tera Tu, Mera Main)

TTMM is a premium fintech application built for seamless group expense splitting. It features a robust mathematical engine for settling debts, a modern mobile-first UI, and AI-powered receipt scanning.

## Features

- **Graph Algorithm Settlement:** A greedy graph matching algorithm that simplifies group debts (e.g., if A owes B ₹100 and B owes C ₹100, the engine simplifies it to A owes C ₹100).
- **Cent-Based Math:** All monetary values are handled as integers (cents/paise) to prevent floating-point errors.
- **The Rogue Cent Logic:** Perfectly distributes remainder cents when splitting amounts equally or proportionally.
- **Proportional Tax/Tip:** When splitting itemized receipts, tax and tip are distributed proportionally based on each user's subtotal share.
- **Gemini Vision Receipt Scanning:** Uses Google's Gemini 2.5 Flash model to extract itemized lists, taxes, and totals from receipt images.
- **Location Tagging:** Tags expenses with real-world locations using the Google Maps Geocoding API (with an OpenStreetMap fallback).

## Environment Setup

1. Copy the `.env.example` file to `.env`:
   ```bash
   cp .env.example .env
   ```

2. Configure your environment variables in `.env`:
   - `GEMINI_API_KEY`: Required for the receipt scanning feature.
   - `GOOGLE_MAPS_API_KEY`: (Optional) Used for location tagging. If not provided, the app gracefully falls back to the free OpenStreetMap (Nominatim) API.

## How to Start

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm run dev
   ```

3. Open your browser and navigate to:
   [http://localhost:3000](http://localhost:3000)

## Architecture

- **Frontend:** React 18, React Router, Tailwind CSS, Framer Motion, Lucide Icons.
- **Backend:** Express.js, SQLite (better-sqlite3).
- **AI:** `@google/genai` SDK.
