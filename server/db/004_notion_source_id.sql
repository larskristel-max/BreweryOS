-- ============================================================
-- Operon BrewOS — Add Notion source integration to brewery profiles
-- Migration: 004_notion_source_id
-- ============================================================

ALTER TABLE brewery_profiles
  ADD COLUMN IF NOT EXISTS notion_source_id text;
