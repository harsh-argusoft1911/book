-- ============================================================
-- Rollback: 001_rollback_pathology_bot_tables.sql
-- Drops all pathology-bot tables cleanly without touching any
-- existing production tables.
-- ============================================================

DROP TABLE IF EXISTS pathology_reports      CASCADE;
DROP TABLE IF EXISTS pathology_bookings     CASCADE;
DROP TABLE IF EXISTS pathology_lab_pricing  CASCADE;
DROP TABLE IF EXISTS pathology_labs         CASCADE;
DROP TABLE IF EXISTS pathology_tests        CASCADE;
DROP TABLE IF EXISTS pathology_sessions     CASCADE;
