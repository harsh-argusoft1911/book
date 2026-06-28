-- ============================================================
-- Migration: 001_create_pathology_bot_tables.sql
-- Module   : pathology-bot (isolated — does NOT touch any existing tables)
-- Rollback : see 001_rollback_pathology_bot_tables.sql
-- ============================================================

-- Session state machine for each WhatsApp number
CREATE TABLE IF NOT EXISTS pathology_sessions (
  id             SERIAL PRIMARY KEY,
  phone_number   VARCHAR(20) NOT NULL UNIQUE,
  current_state  VARCHAR(60) NOT NULL DEFAULT 'IDLE',
  -- IDLE | AWAITING_MENU_CHOICE | AWAITING_TEST_INPUT | AWAITING_TEST_CLARIFY |
  -- AWAITING_LOCATION | AWAITING_LAB_SELECTION | BOOKING_CONFIRMED
  context_json   JSONB       NOT NULL DEFAULT '{}',
  -- stores: { selectedTests: [], selectedLab: {}, nearbyLabs: [] }
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pathology_sessions_phone ON pathology_sessions (phone_number);

-- Test catalog with fuzzy-matchable aliases
CREATE TABLE IF NOT EXISTS pathology_tests (
  id             SERIAL PRIMARY KEY,
  canonical_name VARCHAR(200) NOT NULL,
  aliases        JSONB        NOT NULL DEFAULT '[]',
  -- e.g. ["cbc", "complete blood count", "complete blood test", "haematology"]
  category       VARCHAR(100),
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Lab catalog (isolated from existing labs table)
CREATE TABLE IF NOT EXISTS pathology_labs (
  id          SERIAL PRIMARY KEY,
  name        VARCHAR(200) NOT NULL,
  address     TEXT,
  lat         DOUBLE PRECISION NOT NULL,
  lng         DOUBLE PRECISION NOT NULL,
  phone       VARCHAR(20),
  nabl        BOOLEAN NOT NULL DEFAULT TRUE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pathology_labs_lat_lng ON pathology_labs (lat, lng);

-- Per-lab pricing for each test
CREATE TABLE IF NOT EXISTS pathology_lab_pricing (
  id       SERIAL PRIMARY KEY,
  lab_id   INTEGER NOT NULL REFERENCES pathology_labs(id)  ON DELETE CASCADE,
  test_id  INTEGER NOT NULL REFERENCES pathology_tests(id) ON DELETE CASCADE,
  price    NUMERIC(10, 2) NOT NULL,
  UNIQUE(lab_id, test_id)
);

-- Bookings created via WhatsApp
CREATE TABLE IF NOT EXISTS pathology_bookings (
  id             SERIAL PRIMARY KEY,
  booking_ref    VARCHAR(20)  NOT NULL UNIQUE,
  phone_number   VARCHAR(20)  NOT NULL,
  test_ids       JSONB        NOT NULL DEFAULT '[]',
  lab_id         INTEGER      REFERENCES pathology_labs(id) ON DELETE SET NULL,
  total_amount   NUMERIC(10, 2) NOT NULL,
  payment_mode   VARCHAR(30)  NOT NULL DEFAULT 'pay_on_delivery',
  status         VARCHAR(30)  NOT NULL DEFAULT 'confirmed',
  qr_data        TEXT,        -- QR payload string (placeholder for UPI link)
  created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pathology_bookings_phone ON pathology_bookings (phone_number);

-- Reports linked to phone numbers (for "Get Reports" flow)
CREATE TABLE IF NOT EXISTS pathology_reports (
  id           SERIAL PRIMARY KEY,
  phone_number VARCHAR(20)  NOT NULL,
  pdf_url      TEXT         NOT NULL,
  booking_ref  VARCHAR(20),
  created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pathology_reports_phone ON pathology_reports (phone_number);

-- ============================================================
-- Seed: initial test catalog (edit freely)
-- ============================================================
INSERT INTO pathology_tests (canonical_name, aliases, category) VALUES
  ('Complete Blood Count',          '["cbc","complete blood test","blood count","haematology","hematology","cbp","full blood count","fbc"]', 'Haematology'),
  ('Liver Function Test',           '["lft","liver function","liver panel","hepatic function","liver profile"]', 'Biochemistry'),
  ('Thyroid Stimulating Hormone',   '["tsh","thyroid","thyroid test","thyroid profile","t3 t4 tsh","thyroid function"]', 'Endocrinology'),
  ('Blood Glucose Fasting',         '["fbs","fasting sugar","blood sugar fasting","sugar test","glucose fasting","fasting glucose"]', 'Biochemistry'),
  ('Blood Glucose Random',          '["rbs","random blood sugar","random glucose","sugar random"]', 'Biochemistry'),
  ('HbA1c',                         '["hba1c","glycated haemoglobin","glycated hemoglobin","haemoglobin a1c","a1c","diabetes test"]', 'Endocrinology'),
  ('Lipid Profile',                 '["lipid profile","cholesterol","lipid panel","cholesterol test","trig","triglycerides"]', 'Biochemistry'),
  ('Kidney Function Test',          '["kft","kidney function","renal function","bun creatinine","kidney panel","renal panel"]', 'Biochemistry'),
  ('Urine Routine Examination',     '["ure","urine test","urine routine","urine analysis","urinalysis","urine re"]', 'Pathology'),
  ('Vitamin D',                     '["vitamin d","vit d","25-oh vitamin d","vitamin d3"]', 'Biochemistry'),
  ('Vitamin B12',                   '["b12","vitamin b12","cyanocobalamin"]', 'Biochemistry'),
  ('Dengue NS1 Antigen',            '["dengue","dengue test","dengue ns1","dengue antigen"]', 'Serology'),
  ('Malaria Antigen Test',          '["malaria","malaria test","malaria antigen","mp test"]', 'Serology'),
  ('Widal Test',                    '["widal","typhoid test","typhoid","widal typhoid"]', 'Serology'),
  ('C-Reactive Protein',            '["crp","c reactive protein","inflammation test","crp test"]', 'Biochemistry')
ON CONFLICT DO NOTHING;
