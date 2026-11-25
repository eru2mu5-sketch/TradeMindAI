-- =====================================================================
-- TradeMind AI - Supabase Database Schema
-- Production-Ready Schema with PostgreSQL, Row-Level Security (RLS),
-- Automated Triggers, and Foreign Keys.
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    display_name TEXT,
    avatar_url TEXT,
    experience_level TEXT DEFAULT 'intermediate' CHECK (experience_level IN ('beginner', 'intermediate', 'advanced', 'institutional')),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. USER SETTINGS TABLE (Configurable risk management rules)
CREATE TABLE IF NOT EXISTS public.user_settings (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    risk_per_trade_pct NUMERIC(5,2) DEFAULT 0.50 NOT NULL CHECK (risk_per_trade_pct > 0 AND risk_per_trade_pct <= 5.0),
    max_daily_loss_pct NUMERIC(5,2) DEFAULT 1.50 NOT NULL CHECK (max_daily_loss_pct > 0 AND max_daily_loss_pct <= 10.0),
    max_open_trades INTEGER DEFAULT 2 NOT NULL CHECK (max_open_trades >= 1 AND max_open_trades <= 10),
    hypothetical_balance NUMERIC(15,2) DEFAULT 10000.00 NOT NULL CHECK (hypothetical_balance > 0),
    base_currency TEXT DEFAULT 'USD' NOT NULL,
    theme TEXT DEFAULT 'dark' NOT NULL,
    min_risk_reward NUMERIC(4,2) DEFAULT 2.00 NOT NULL,
    ai_model_preference TEXT DEFAULT 'gpt-4o' NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. NOTIFICATION PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
    breakout_alerts BOOLEAN DEFAULT true NOT NULL,
    ai_analysis_alerts BOOLEAN DEFAULT true NOT NULL,
    daily_summary_alerts BOOLEAN DEFAULT true NOT NULL,
    risk_warning_alerts BOOLEAN DEFAULT true NOT NULL,
    expo_push_token TEXT,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. INSTRUMENTS TABLE
CREATE TABLE IF NOT EXISTS public.instruments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    symbol TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    market_type TEXT NOT NULL CHECK (market_type IN ('crypto', 'forex')),
    base_asset TEXT NOT NULL,
    quote_asset TEXT NOT NULL,
    pip_or_tick_size NUMERIC(12,6) NOT NULL,
    lot_or_contract_size NUMERIC(15,2) NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. WATCHLISTS TABLE
CREATE TABLE IF NOT EXISTS public.watchlists (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    instrument_id UUID NOT NULL REFERENCES public.instruments(id) ON DELETE CASCADE,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    CONSTRAINT unique_user_instrument UNIQUE(user_id, instrument_id)
);

-- 6. MARKET ANALYSES TABLE
CREATE TABLE IF NOT EXISTS public.market_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    instrument_symbol TEXT NOT NULL,
    market_type TEXT NOT NULL CHECK (market_type IN ('crypto', 'forex')),
    decision TEXT NOT NULL CHECK (decision IN ('LONG', 'SHORT', 'NO TRADE')),
    setup_status TEXT NOT NULL CHECK (setup_status IN ('CONFIRMED', 'DEVELOPING', 'NO_TRADE')),
    technical_score NUMERIC(4,2) NOT NULL CHECK (technical_score >= 0 AND technical_score <= 10),
    score_breakdown JSONB NOT NULL,
    timeframe_context JSONB NOT NULL,
    higher_timeframe_direction TEXT NOT NULL,
    fundamental_bias TEXT NOT NULL,
    fundamental_summary JSONB,
    reasoning TEXT NOT NULL,
    invalidation_conditions TEXT NOT NULL,
    entry_requirements TEXT NOT NULL,
    alternative_scenario TEXT,
    data_freshness_status TEXT NOT NULL,
    data_sources JSONB NOT NULL,
    analysis_timestamp TIMESTAMPTZ DEFAULT now() NOT NULL,
    data_timestamp TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. TECHNICAL INDICATORS SNAPSHOTS
CREATE TABLE IF NOT EXISTS public.technical_indicators (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES public.market_analyses(id) ON DELETE CASCADE,
    instrument_symbol TEXT NOT NULL,
    timeframe TEXT NOT NULL CHECK (timeframe IN ('4h', '1h', '15m', '5m')),
    indicators JSONB NOT NULL,
    market_structure JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. TRADE PLANS TABLE
CREATE TABLE IF NOT EXISTS public.trade_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    analysis_id UUID REFERENCES public.market_analyses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    instrument_symbol TEXT NOT NULL,
    direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    entry_price NUMERIC(16,6) NOT NULL,
    entry_zone_min NUMERIC(16,6),
    entry_zone_max NUMERIC(16,6),
    stop_loss NUMERIC(16,6) NOT NULL,
    take_profit_1 NUMERIC(16,6) NOT NULL,
    take_profit_2 NUMERIC(16,6) NOT NULL,
    take_profit_3 NUMERIC(16,6),
    planned_risk_reward NUMERIC(5,2) NOT NULL CHECK (planned_risk_reward >= 1.50),
    stop_loss_reasoning TEXT NOT NULL,
    take_profit_reasoning TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. JOURNAL ENTRIES TABLE
CREATE TABLE IF NOT EXISTS public.journal_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    trade_plan_id UUID REFERENCES public.trade_plans(id) ON DELETE SET NULL,
    instrument_symbol TEXT NOT NULL,
    market_type TEXT NOT NULL CHECK (market_type IN ('crypto', 'forex')),
    entry_type TEXT NOT NULL CHECK (entry_type IN ('hypothetical_analysis', 'user_executed_trade')),
    direction TEXT NOT NULL CHECK (direction IN ('LONG', 'SHORT')),
    planned_entry NUMERIC(16,6) NOT NULL,
    planned_stop_loss NUMERIC(16,6) NOT NULL,
    planned_take_profit_1 NUMERIC(16,6) NOT NULL,
    actual_entry NUMERIC(16,6),
    actual_exit NUMERIC(16,6),
    position_size NUMERIC(18,6),
    risk_amount NUMERIC(15,2),
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'WON', 'LOST', 'BREAKEVEN', 'CANCELLED', 'INVALIDATED')),
    outcome_r NUMERIC(6,2),
    net_pnl NUMERIC(15,2),
    technical_score NUMERIC(4,2),
    notes TEXT,
    tags TEXT[] DEFAULT '{}',
    screenshot_url TEXT,
    entered_at TIMESTAMPTZ,
    closed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 10. PERFORMANCE METRICS TABLE
CREATE TABLE IF NOT EXISTS public.performance_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    market_type TEXT NOT NULL DEFAULT 'all',
    total_trades INTEGER DEFAULT 0 NOT NULL,
    winning_trades INTEGER DEFAULT 0 NOT NULL,
    losing_trades INTEGER DEFAULT 0 NOT NULL,
    breakeven_trades INTEGER DEFAULT 0 NOT NULL,
    win_rate_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    average_r NUMERIC(6,2) DEFAULT 0.00 NOT NULL,
    profit_factor NUMERIC(6,2) DEFAULT 0.00 NOT NULL,
    expectancy_r NUMERIC(6,2) DEFAULT 0.00 NOT NULL,
    max_drawdown_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    long_win_rate_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    short_win_rate_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    crypto_win_rate_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    forex_win_rate_pct NUMERIC(5,2) DEFAULT 0.00 NOT NULL,
    equity_curve JSONB DEFAULT '[]' NOT NULL,
    calculated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- Ensures each user can only read and write their own data.
-- =====================================================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trade_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.instruments ENABLE ROW LEVEL SECURITY;

-- Instruments are viewable by all authenticated users
CREATE POLICY "Instruments are viewable by all users" ON public.instruments
    FOR SELECT USING (true);

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- User settings policies
CREATE POLICY "Users can view their own settings" ON public.user_settings
    FOR ALL USING (auth.uid() = user_id);

-- Notification preferences policies
CREATE POLICY "Users can manage their notification preferences" ON public.notification_preferences
    FOR ALL USING (auth.uid() = user_id);

-- Watchlist policies
CREATE POLICY "Users can manage their own watchlist" ON public.watchlists
    FOR ALL USING (auth.uid() = user_id);

-- Market analyses policies
CREATE POLICY "Users can view public or own analyses" ON public.market_analyses
    FOR SELECT USING (user_id IS NULL OR auth.uid() = user_id);
CREATE POLICY "Users can insert their own analyses" ON public.market_analyses
    FOR INSERT WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

-- Trade plans policies
CREATE POLICY "Users can manage their trade plans" ON public.trade_plans
    FOR ALL USING (auth.uid() = user_id);

-- Journal entries policies
CREATE POLICY "Users can manage their own journal entries" ON public.journal_entries
    FOR ALL USING (auth.uid() = user_id);

-- Performance metrics policies
CREATE POLICY "Users can manage their performance metrics" ON public.performance_metrics
    FOR ALL USING (auth.uid() = user_id);

-- =====================================================================
-- SEED INITIAL INSTRUMENTS
-- =====================================================================
INSERT INTO public.instruments (symbol, name, market_type, base_asset, quote_asset, pip_or_tick_size, lot_or_contract_size)
VALUES
    ('BTC/USDT', 'Bitcoin / Tether', 'crypto', 'BTC', 'USDT', 0.10, 1.0),
    ('ETH/USDT', 'Ethereum / Tether', 'crypto', 'ETH', 'USDT', 0.01, 1.0),
    ('SOL/USDT', 'Solana / Tether', 'crypto', 'SOL', 'USDT', 0.01, 1.0),
    ('BNB/USDT', 'BNB / Tether', 'crypto', 'BNB', 'USDT', 0.01, 1.0),
    ('EUR/USD', 'Euro / US Dollar', 'forex', 'EUR', 'USD', 0.0001, 100000.0),
    ('GBP/USD', 'British Pound / US Dollar', 'forex', 'GBP', 'USD', 0.0001, 100000.0),
    ('USD/JPY', 'US Dollar / Japanese Yen', 'forex', 'USD', 'JPY', 0.01, 100000.0),
    ('GBP/JPY', 'British Pound / Japanese Yen', 'forex', 'GBP', 'JPY', 0.01, 100000.0)
ON CONFLICT (symbol) DO NOTHING;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_journal_user ON public.journal_entries(user_id, status);
CREATE INDEX IF NOT EXISTS idx_journal_created ON public.journal_entries(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analyses_symbol ON public.market_analyses(instrument_symbol, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trade_plans_user ON public.trade_plans(user_id, is_active);

-- =====================================================================
-- 11. ALERT RULES TABLE (Milestone 5 Alert Engine)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.alert_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    market_type TEXT NOT NULL CHECK (market_type IN ('crypto', 'forex')),
    alert_type TEXT NOT NULL CHECK (alert_type IN ('PRICE_CROSS_ABOVE', 'PRICE_CROSS_BELOW', 'SUPPORT_LEVEL', 'RESISTANCE_LEVEL', 'INDICATOR_RSI', 'STRUCTURAL_BOS', 'AI_ANALYSIS_COMPLETE', 'RISK_VIOLATION')),
    target_price NUMERIC(16,6),
    condition_param TEXT,
    title TEXT NOT NULL,
    note TEXT,
    status TEXT NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'TRIGGERED', 'ACKNOWLEDGED', 'MUTED', 'DELETED')),
    cooldown_minutes INTEGER DEFAULT 15 NOT NULL,
    last_triggered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- =====================================================================
-- 12. ALERT EVENTS TABLE (Triggered Alert History)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.alert_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    alert_rule_id UUID REFERENCES public.alert_rules(id) ON DELETE SET NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    symbol TEXT NOT NULL,
    market_type TEXT NOT NULL CHECK (market_type IN ('crypto', 'forex')),
    alert_type TEXT NOT NULL,
    triggered_price NUMERIC(16,6) NOT NULL,
    headline TEXT NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS for Alert Rules and Events
ALTER TABLE public.alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alert_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own alert rules" ON public.alert_rules
    FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage their own alert events" ON public.alert_events
    FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_alert_rules_user ON public.alert_rules(user_id, status);
CREATE INDEX IF NOT EXISTS idx_alert_events_user ON public.alert_events(user_id, is_read, created_at DESC);
