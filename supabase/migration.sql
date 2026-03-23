-- ============================================================
-- QBank Platform — Multi-Tenant Supabase Migration
-- Run in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Profiles (one row per user PER qbank)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  qbank_id TEXT NOT NULL,
  email TEXT,
  full_name TEXT DEFAULT '',
  role TEXT DEFAULT 'user',
  subscription_status TEXT DEFAULT 'trial',
  questions_answered_count INTEGER DEFAULT 0,
  created_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT,
  UNIQUE(auth_id, qbank_id)
);

-- 2. Questions
CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qbank_id TEXT NOT NULL,
  question_text TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]',
  explanation TEXT,
  reference TEXT,
  category TEXT,
  difficulty TEXT DEFAULT 'intermediate',
  tags JSONB DEFAULT '[]',
  created_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- 3. Question Reports
CREATE TABLE IF NOT EXISTS question_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qbank_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  reason TEXT DEFAULT 'reported',
  details TEXT,
  status TEXT DEFAULT 'pending',
  question_text TEXT,
  created_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- 4. Study Sessions
CREATE TABLE IF NOT EXISTS study_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qbank_id TEXT NOT NULL,
  session_type TEXT,
  category TEXT,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  total_time INTEGER DEFAULT 0,
  score_percentage NUMERIC DEFAULT 0,
  difficulty_filter TEXT DEFAULT 'all',
  created_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- 5. Test Sessions
CREATE TABLE IF NOT EXISTS test_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qbank_id TEXT NOT NULL,
  session_name TEXT,
  session_type TEXT,
  exam_type TEXT,
  total_questions INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  score_percentage NUMERIC DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  completed_at TIMESTAMPTZ,
  category_breakdown JSONB DEFAULT '{}',
  difficulty_filter TEXT DEFAULT 'all',
  created_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- 6. Session Answers
CREATE TABLE IF NOT EXISTS session_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qbank_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  question_order INTEGER DEFAULT 0,
  selected_option_index INTEGER,
  correct_option_index INTEGER,
  is_correct BOOLEAN DEFAULT false,
  time_spent_seconds INTEGER DEFAULT 0,
  is_flagged BOOLEAN DEFAULT false,
  question_category TEXT,
  question_difficulty TEXT,
  created_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- 7. User Progress
CREATE TABLE IF NOT EXISTS user_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  qbank_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  selected_option INTEGER,
  time_spent INTEGER DEFAULT 0,
  mode TEXT,
  is_bookmarked BOOLEAN DEFAULT false,
  is_flagged BOOLEAN DEFAULT false,
  created_date TIMESTAMPTZ DEFAULT now(),
  created_by TEXT
);

-- ============================================================
-- Indexes for performance
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_profiles_auth_qbank ON profiles(auth_id, qbank_id);
CREATE INDEX IF NOT EXISTS idx_questions_qbank ON questions(qbank_id);
CREATE INDEX IF NOT EXISTS idx_study_sessions_qbank ON study_sessions(qbank_id, created_by);
CREATE INDEX IF NOT EXISTS idx_user_progress_qbank ON user_progress(qbank_id, created_by);

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE study_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE test_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_answers ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- Profiles: users see their own (across qbanks they belong to)
CREATE POLICY "profiles_select" ON profiles FOR SELECT USING (auth.uid() = auth_id);
CREATE POLICY "profiles_insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = auth_id);
CREATE POLICY "profiles_update" ON profiles FOR UPDATE USING (auth.uid() = auth_id);

-- Questions: all authenticated users can read
CREATE POLICY "questions_read" ON questions FOR SELECT TO authenticated USING (true);

-- User data tables: users can only access their own rows
CREATE POLICY "qr_insert" ON question_reports FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "qr_select" ON question_reports FOR SELECT USING (created_by = (SELECT email FROM profiles WHERE auth_id = auth.uid() LIMIT 1));

CREATE POLICY "ss_all" ON study_sessions FOR ALL USING (created_by = (SELECT email FROM profiles WHERE auth_id = auth.uid() LIMIT 1));
CREATE POLICY "ss_insert" ON study_sessions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "ts_all" ON test_sessions FOR ALL USING (created_by = (SELECT email FROM profiles WHERE auth_id = auth.uid() LIMIT 1));
CREATE POLICY "ts_insert" ON test_sessions FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "sa_all" ON session_answers FOR ALL USING (created_by = (SELECT email FROM profiles WHERE auth_id = auth.uid() LIMIT 1));
CREATE POLICY "sa_insert" ON session_answers FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "up_all" ON user_progress FOR ALL USING (created_by = (SELECT email FROM profiles WHERE auth_id = auth.uid() LIMIT 1));
CREATE POLICY "up_insert" ON user_progress FOR INSERT TO authenticated WITH CHECK (true);
