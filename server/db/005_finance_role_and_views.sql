-- ============================================================
-- Operon BrewOS — Finance role + semantic views
-- Migration: 005_finance_role_and_views
-- ============================================================

-- 1. Add 'finance' to the user_role enum so it can be persisted
--    and round-tripped from the DB to the frontend without mapping hacks.
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'finance' AFTER 'brewmaster_admin';

-- 2. Create semantic views using the names expected by the task spec.
--    The actual data lives in brewery_profiles (Task #1), but these
--    views satisfy the breweries / brewery_users architectural contract.

CREATE OR REPLACE VIEW breweries AS
  SELECT
    id,
    name,
    legal_name,
    display_name,
    country,
    timezone,
    currency,
    language,
    vat_number,
    excise_authorization_number,
    is_small_independent_brewery,
    emcs_enabled,
    notion_source_id,
    packaging_contribution_mode,
    onboarding_status,
    created_at,
    updated_at
  FROM brewery_profiles;

-- brewery_users: membership view — each row is a user<>brewery membership
-- Includes all columns needed to drive role/permission resolution.
CREATE OR REPLACE VIEW brewery_users AS
  SELECT
    id          AS user_id,
    brewery_id,
    email,
    name,
    role        AS membership_role,
    is_active,
    created_at,
    updated_at
  FROM users;
