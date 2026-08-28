CREATE TABLE public.matches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task text NOT NULL,
  weights jsonb NOT NULL DEFAULT '{"quality":35,"result":35,"efficiency":15,"cost":15}'::jsonb,
  mode text NOT NULL DEFAULT 'single',
  status text NOT NULL DEFAULT 'running',
  winner_model text,
  referee_notes text,
  exhibition boolean NOT NULL DEFAULT false,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE public.match_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id uuid NOT NULL REFERENCES public.matches(id) ON DELETE CASCADE,
  model_id text NOT NULL,
  output_text text,
  latency_ms integer,
  prompt_tokens integer,
  completion_tokens integer,
  cost_usd numeric,
  quality_score numeric,
  result_score numeric,
  efficiency_score numeric,
  cost_score numeric,
  overall_score numeric,
  referee_comment text,
  error_text text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (match_id, model_id)
);

CREATE INDEX match_entries_match_id_idx ON public.match_entries(match_id);
CREATE INDEX matches_created_at_idx ON public.matches(created_at DESC);

GRANT SELECT ON public.matches TO anon;
GRANT SELECT, INSERT ON public.matches TO authenticated;
GRANT ALL ON public.matches TO service_role;

GRANT SELECT ON public.match_entries TO anon;
GRANT SELECT ON public.match_entries TO authenticated;
GRANT ALL ON public.match_entries TO service_role;

ALTER TABLE public.matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.match_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Matches are publicly readable" ON public.matches FOR SELECT USING (true);
CREATE POLICY "Users can create their own matches" ON public.matches FOR INSERT TO authenticated WITH CHECK (auth.uid() = created_by);
CREATE POLICY "Match entries are publicly readable" ON public.match_entries FOR SELECT USING (true);