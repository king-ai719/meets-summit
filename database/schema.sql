-- ============================================
-- RPG MATCHING APP - DATABASE SCHEMA
-- Supabase / PostgreSQL
-- ============================================

-- 職業カテゴリ
CREATE TYPE job_category AS ENUM (
  'business',     -- 仕事系
  'night_men',    -- 夜職 men
  'night_wom',    -- 夜職 wom
  'executive',    -- ビジネス系
  'neet'          -- ニート・無職
);

-- 役職
CREATE TYPE job_rank AS ENUM (
  'kou',    -- 皇（社長・個人事業主・フリーランス）
  'ou',     -- 王（役員）
  'shou',   -- 将（管理職）
  'shi',    -- 士（社員）
  'hito'    -- 人（アルバイト）
);

-- 雇用形態
CREATE TYPE employment_type AS ENUM (
  'corporation',   -- 法人（社長・役員）
  'sole',          -- 個人事業主
  'freelance',     -- フリーランス
  'employee',      -- 雇用者（管理職・社員・アルバイト）
  'neet'           -- ニート・無職
);

-- ユーザー種別
CREATE TYPE user_type AS ENUM (
  'general',       -- 一般（無料）
  'premium',       -- プレミアム（課金）
  'guild_master'   -- ギルドマスター（課金+審査）
);

-- 審査書類種別
CREATE TYPE doc_type AS ENUM (
  'license',          -- 免許証
  'corporate_number', -- 法人番号
  'business_card',    -- 名刺
  'registry'          -- 登記簿謄本（将来用）
);

-- 審査ステータス
CREATE TYPE application_status AS ENUM (
  'pending',   -- 審査中
  'approved',  -- 承認
  'rejected'   -- 却下
);

-- ============================================
-- TABLES
-- ============================================

-- 職業クラス一覧
CREATE TABLE job_classes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category      job_category NOT NULL,
  name          TEXT NOT NULL,                -- 例: 運送業, IT・エンジニア
  rp_prefix     TEXT NOT NULL,               -- 例: 運, 魔, 夜
  icon          TEXT NOT NULL,               -- 例: 🚚, 💻, 🌙
  sort_order    INTEGER DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ユーザー
CREATE TABLE users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE NOT NULL,
  username      TEXT UNIQUE NOT NULL,
  avatar_url    TEXT,
  bio           TEXT,
  job_class_id  UUID REFERENCES job_classes(id),
  job_rank      job_rank DEFAULT 'hito',
  employment    employment_type DEFAULT 'employee',
  gender        TEXT CHECK (gender IN ('male', 'female', 'other')),
  user_type     user_type DEFAULT 'general',
  is_active     BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ギルド
CREATE TABLE guilds (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  description   TEXT,
  job_class_id  UUID REFERENCES job_classes(id),
  owner_id      UUID REFERENCES users(id) NOT NULL,
  is_verified   BOOLEAN DEFAULT FALSE,
  is_public     BOOLEAN DEFAULT TRUE,
  member_limit  INTEGER DEFAULT 100,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ギルドメンバー
CREATE TABLE guild_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  guild_id      UUID REFERENCES guilds(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  role          TEXT DEFAULT 'member' CHECK (role IN ('master', 'officer', 'member')),
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (guild_id, user_id)
);

-- マッチング
CREATE TABLE matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  user_b_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  match_type    TEXT CHECK (match_type IN ('love', 'work', 'hobby', 'night')),
  status        TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'rejected')),
  matched_at    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (user_a_id, user_b_id)
);

-- メッセージ
CREATE TABLE messages (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  match_id      UUID REFERENCES matches(id) ON DELETE CASCADE,
  sender_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  content       TEXT NOT NULL,
  is_read       BOOLEAN DEFAULT FALSE,
  sent_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ギルドマスター審査申請
CREATE TABLE gm_applications (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  guild_id        UUID REFERENCES guilds(id) ON DELETE CASCADE,
  employment      employment_type NOT NULL,
  -- 法人: 法人番号+免許証 / 個人・フリーランス: 名刺+免許証
  doc_type_1      doc_type NOT NULL,
  doc_type_2      doc_type NOT NULL,
  doc_url_1       TEXT NOT NULL,   -- Cloudflare R2 URL
  doc_url_2       TEXT NOT NULL,   -- Cloudflare R2 URL
  status          application_status DEFAULT 'pending',
  reviewer_note   TEXT,
  submitted_at    TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at     TIMESTAMPTZ
);

-- 課金・決済
CREATE TABLE payments (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  stripe_id       TEXT UNIQUE NOT NULL,   -- Stripe Payment Intent ID
  stripe_customer TEXT,                   -- Stripe Customer ID
  plan            TEXT CHECK (plan IN ('premium_monthly', 'premium_annual', 'guild_master')),
  status          TEXT CHECK (status IN ('active', 'cancelled', 'expired')),
  amount          INTEGER NOT NULL,        -- 円
  period_start    TIMESTAMPTZ,
  period_end      TIMESTAMPTZ,
  paid_at         TIMESTAMPTZ DEFAULT NOW()
);

-- 通知
CREATE TABLE notifications (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL,   -- 'match', 'message', 'guild_invite', 'application'
  title         TEXT NOT NULL,
  content       TEXT,
  is_read       BOOLEAN DEFAULT FALSE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_users_job_class    ON users(job_class_id);
CREATE INDEX idx_users_user_type    ON users(user_type);
CREATE INDEX idx_guilds_owner       ON guilds(owner_id);
CREATE INDEX idx_guilds_job_class   ON guilds(job_class_id);
CREATE INDEX idx_guild_members_user ON guild_members(user_id);
CREATE INDEX idx_guild_members_guild ON guild_members(guild_id);
CREATE INDEX idx_matches_user_a     ON matches(user_a_id);
CREATE INDEX idx_matches_user_b     ON matches(user_b_id);
CREATE INDEX idx_messages_match     ON messages(match_id);
CREATE INDEX idx_messages_sender    ON messages(sender_id);
CREATE INDEX idx_gm_applications_user ON gm_applications(user_id);
CREATE INDEX idx_payments_user      ON payments(user_id);
CREATE INDEX idx_notifications_user ON notifications(user_id);

-- ============================================
-- SEED: job_classes
-- ============================================

INSERT INTO job_classes (category, name, rp_prefix, icon, sort_order) VALUES
-- 仕事系
('business', '運送業',        '運',  '🚚', 10),
('business', '飲食業',        '料理','👨‍🍳', 20),
('business', 'IT・エンジニア','魔',  '💻', 30),
('business', '医療・看護',    '癒',  '⚕️', 40),
('business', '営業・販売',    '商',  '🏪', 50),
('business', '建設・土木',    '建',  '🔨', 60),
-- 夜職
('night_men','夜職 men',      '夜',  '🌙', 70),
('night_wom','夜職 wom',      '夜',  '🌹', 80),
-- ビジネス系
('executive','経営・コンサル','覇',  '👑', 90),
('executive','投資家・VC',    '金',  '💰',100),
('executive','不動産',        '地',  '🏰',110),
('executive','法律・士業',    '法',  '⚖️',120),
-- ニート
('neet',     'ニート・無職',  '遊',  '🎲',130);

-- ============================================
-- FUNCTIONS
-- ============================================

-- 称号を生成する関数
CREATE OR REPLACE FUNCTION get_rp_title(
  p_job_class_id UUID,
  p_rank job_rank,
  p_employment employment_type,
  p_gender TEXT DEFAULT NULL
)
RETURNS TEXT AS $$
DECLARE
  v_prefix TEXT;
  v_category job_category;
  v_suffix TEXT;
BEGIN
  SELECT rp_prefix, category INTO v_prefix, v_category
  FROM job_classes WHERE id = p_job_class_id;

  -- ニートは特殊ルール
  IF v_category = 'neet' THEN
    IF p_employment IN ('neet') AND p_rank = 'kou' THEN
      RETURN 'ネオニート👾';
    END IF;
    RETURN '遊び人🎲';
  END IF;

  -- 夜職womは女性称号
  IF v_category = 'night_wom' THEN
    v_suffix := CASE p_rank
      WHEN 'kou'  THEN '皇后'
      WHEN 'ou'   THEN '王妃'
      WHEN 'shou' THEN '将姫'
      WHEN 'shi'  THEN '士女'
      WHEN 'hito' THEN 'の人'
    END;
    RETURN v_prefix || v_suffix;
  END IF;

  -- 通常職業
  v_suffix := CASE p_rank
    WHEN 'kou'  THEN '皇'
    WHEN 'ou'   THEN '王'
    WHEN 'shou' THEN '将'
    WHEN 'shi'  THEN '士'
    WHEN 'hito' THEN 'の人'
  END;

  RETURN v_prefix || v_suffix;
END;
$$ LANGUAGE plpgsql;

