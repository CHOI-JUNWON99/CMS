-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.access_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone,
  version integer DEFAULT 1,
  is_admin boolean DEFAULT false,
  is_hidden boolean DEFAULT false,
  CONSTRAINT access_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.admin_codes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  code text NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT admin_codes_pkey PRIMARY KEY (id)
);
CREATE TABLE public.business_segments (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stock_id text NOT NULL,
  name text NOT NULL,
  name_kr text NOT NULL,
  value real NOT NULL,
  sort_order integer DEFAULT 0,
  icon_url text,
  icon_urls ARRAY DEFAULT '{}'::text[],
  CONSTRAINT business_segments_pkey PRIMARY KEY (id),
  CONSTRAINT business_segments_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.stocks(id)
);
CREATE TABLE public.clients (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  code text NOT NULL UNIQUE,
  password text,
  description text,
  logo_url text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  brand_color text DEFAULT '#1e3a8a'::text,
  password_hash text,
  show_policy_news boolean DEFAULT false,
  CONSTRAINT clients_pkey PRIMARY KEY (id)
);
CREATE TABLE public.glossary (
  term text NOT NULL,
  definition text NOT NULL,
  CONSTRAINT glossary_pkey PRIMARY KEY (term)
);
CREATE TABLE public.ib_opinions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  date date NOT NULL,
  stock_name text NOT NULL,
  ticker text NOT NULL,
  sector text,
  ib text NOT NULL,
  opinion text,
  prev_price text,
  target_price text,
  target_change numeric,
  current_price text,
  upside numeric,
  eps numeric,
  comment text,
  analyst text,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT ib_opinions_pkey PRIMARY KEY (id)
);
CREATE TABLE public.investment_points (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stock_id text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  sort_order integer DEFAULT 0,
  CONSTRAINT investment_points_pkey PRIMARY KEY (id),
  CONSTRAINT investment_points_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.stocks(id)
);
CREATE TABLE public.issues (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  stock_id text NOT NULL,
  title text,
  content text NOT NULL,
  date text NOT NULL,
  is_cms boolean DEFAULT false,
  keywords ARRAY DEFAULT '{}'::text[],
  created_at timestamp with time zone DEFAULT now(),
  images jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone,
  source text,
  CONSTRAINT issues_pkey PRIMARY KEY (id),
  CONSTRAINT issues_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.stocks(id)
);
CREATE TABLE public.login_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  ip_hash text NOT NULL,
  attempted_at timestamp with time zone DEFAULT now(),
  success boolean DEFAULT false,
  CONSTRAINT login_attempts_pkey PRIMARY KEY (id)
);
CREATE TABLE public.page_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  visited_at timestamp with time zone DEFAULT now(),
  CONSTRAINT page_views_pkey PRIMARY KEY (id)
);
CREATE TABLE public.portfolio_stocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL,
  stock_id text NOT NULL,
  added_at timestamp with time zone DEFAULT now(),
  CONSTRAINT portfolio_stocks_pkey PRIMARY KEY (id),
  CONSTRAINT portfolio_stocks_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id),
  CONSTRAINT portfolio_stocks_stock_id_fkey FOREIGN KEY (stock_id) REFERENCES public.stocks(id)
);
CREATE TABLE public.portfolio_views (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  portfolio_id uuid NOT NULL,
  viewed_at timestamp with time zone DEFAULT now(),
  client_id uuid,
  CONSTRAINT portfolio_views_pkey PRIMARY KEY (id),
  CONSTRAINT portfolio_views_portfolio_id_fkey FOREIGN KEY (portfolio_id) REFERENCES public.portfolios(id),
  CONSTRAINT portfolio_views_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.portfolios (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  is_active boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  client_id uuid,
  portfolio_type text DEFAULT 'standard'::text,
  CONSTRAINT portfolios_pkey PRIMARY KEY (id),
  CONSTRAINT portfolios_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.refresh_tokens (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  token_hash text NOT NULL UNIQUE,
  family_id uuid NOT NULL,
  user_type text NOT NULL,
  access_type text,
  client_id text,
  client_ids ARRAY,
  client_name text,
  brand_color text,
  logo_url text,
  expires_at timestamp with time zone NOT NULL,
  used boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id)
);
CREATE TABLE public.resources (
  id text NOT NULL,
  title text NOT NULL,
  description text,
  file_type text NOT NULL CHECK (file_type = ANY (ARRAY['PDF'::text, 'EXCEL'::text, 'WORD'::text, 'PPT'::text])),
  category text NOT NULL,
  date text NOT NULL,
  file_size text,
  file_url text,
  created_at timestamp with time zone DEFAULT now(),
  client_id uuid,
  original_filename text,
  CONSTRAINT resources_pkey PRIMARY KEY (id),
  CONSTRAINT resources_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);
CREATE TABLE public.segment_icons (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon_url text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT segment_icons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.shared_passwords (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  password text NOT NULL UNIQUE,
  is_master boolean DEFAULT false,
  client_ids ARRAY DEFAULT '{}'::uuid[],
  brand_color text DEFAULT '#1e3a8a'::text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  password_hash text,
  show_policy_news boolean DEFAULT false,
  CONSTRAINT shared_passwords_pkey PRIMARY KEY (id)
);
CREATE TABLE public.stocks (
  id text NOT NULL,
  ticker text NOT NULL,
  name text NOT NULL,
  name_kr text NOT NULL,
  sector text NOT NULL,
  keywords ARRAY DEFAULT '{}'::text[],
  description text,
  market_cap text,
  return_rate real,
  per real,
  pbr real,
  psr real,
  last_update timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  ai_summary text,
  ai_summary_keywords ARRAY DEFAULT '{}'::text[],
  tickers ARRAY DEFAULT '{}'::text[],
  market_cap_value bigint,
  CONSTRAINT stocks_pkey PRIMARY KEY (id)
);
CREATE TABLE public.policy_news (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  title text,
  content text NOT NULL,
  keywords ARRAY DEFAULT '{}'::text[],
  date text NOT NULL,
  is_cms boolean DEFAULT false,
  images jsonb DEFAULT '[]'::jsonb,
  client_id uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone,
  CONSTRAINT policy_news_pkey PRIMARY KEY (id),
  CONSTRAINT policy_news_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id)
);

-- ==========================================
-- ETF feature migration notes
-- Run separately in Supabase SQL editor
-- ==========================================

CREATE TABLE IF NOT EXISTS public.etfs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL REFERENCES public.clients(id),
  code text NOT NULL UNIQUE,
  name_en text NOT NULL,
  close_price_cny numeric,
  minimum_purchase_unit integer,
  minimum_purchase_amount_krw numeric,
  listing_date date,
  aum_cny_million numeric,
  aum_krw_billion numeric,
  benchmark_name_en text,
  category_large text,
  category_small text,
  ter numeric,
  dividend_yield numeric,
  avg_trading_value_ytd_billion numeric,
  return_1m numeric,
  return_3m numeric,
  return_6m numeric,
  return_1y numeric,
  sector text,
  volume numeric,
  summary text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.etfs
ADD COLUMN IF NOT EXISTS client_id uuid;

CREATE INDEX IF NOT EXISTS etfs_is_active_idx ON public.etfs (is_active);
CREATE INDEX IF NOT EXISTS etfs_code_idx ON public.etfs (code);
CREATE INDEX IF NOT EXISTS etfs_client_id_idx ON public.etfs (client_id);
