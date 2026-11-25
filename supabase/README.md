# TradeMind AI - Supabase Backend Configuration

This directory contains the production database architecture for TradeMind AI.

## Architecture Highlights
- **PostgreSQL Database** with full relational integrity and UUID primary keys.
- **Strict Row-Level Security (RLS)**: Enforces that users can only view, create, and modify their own trading plans, journal entries, performance metrics, and risk settings.
- **Audit Timestamps & Performance Indexes**: Optimized index trees on `(user_id, status)` and `(user_id, created_at DESC)` for fast historical journal pagination.

## Schema Tables
1. `profiles`: User profile, display name, experience level.
2. `user_settings`: Configurable institutional risk rules (0.5% default risk per trade, 1.5% max daily loss, max 2 concurrent positions, minimum 1:2.0 R:R).
3. `notification_preferences`: Alert toggles for Breakouts (BOS/CHoCH), Confirmed AI Analyses, and Risk Limit Warnings.
4. `instruments`: Supported crypto and forex market instruments (BTC/USDT, ETH/USDT, EUR/USD, GBP/USD, SOL/USDT, BNB/USDT, USD/JPY, GBP/JPY).
5. `watchlists`: User watchlists with custom display order.
6. `market_analyses`: Recorded quantitative multi-timeframe analyses with structured decisions (LONG, SHORT, NO TRADE).
7. `technical_indicators`: Snapshots of calculated technical indicators and market structure events.
8. `trade_plans`: Calculated entry zones, structural stop losses (with ATR buffers), and targets (TP1, TP2, TP3) with enforced minimum 1:2.0 R:R.
9. `journal_entries`: Trading journal tracking hypothetical analyses versus actual user-executed trades, along with R-multiple outcomes and net PnL.
10. `performance_metrics`: Calculated quantitative trading analytics (win rate, average R, profit factor, expectancy, max drawdown, long/short and crypto/forex breakdowns).

## How to Deploy to Supabase
1. Create a project at [https://supabase.com](https://supabase.com).
2. Navigate to the **SQL Editor** in your Supabase Dashboard.
3. Open `supabase/schema.sql` from this repository.
4. Copy and paste the contents into the SQL Editor and click **Run**.
5. Copy your **Project URL** and **Anon Key** into your TradeMind AI `.env` or the app's **Settings** screen.
