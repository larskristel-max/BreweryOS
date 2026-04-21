-- ============================================================
-- Operon BrewOS — Brewery Provisioning RPC
-- Migration: 003_provision_rpc
-- Used by: functions/api/provision-brewery.ts (service role)
-- Executes atomically inside a single DB transaction.
-- Idempotent: if the auth user already has a users row, returns
-- the existing brewery_id without creating duplicates.
-- ============================================================

CREATE OR REPLACE FUNCTION provision_brewery(
  p_auth_user_id    uuid,
  p_user_name       text,
  p_user_email      text,
  p_brewery_name    text,
  p_country         text,
  p_language        text,
  p_timezone        text,
  p_emcs_enabled    boolean,
  p_notion_source_id text DEFAULT NULL
)
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_brewery_id uuid;
  v_result     json;
BEGIN
  -- Idempotency: if user already provisioned, return existing brewery_id
  SELECT brewery_id INTO v_brewery_id
  FROM users
  WHERE id = p_auth_user_id;

  IF FOUND THEN
    RETURN json_build_object('brewery_id', v_brewery_id, 'already_existed', true);
  END IF;

  -- 1. Insert brewery profile
  INSERT INTO brewery_profiles (
    name,
    country,
    language,
    timezone,
    currency,
    emcs_enabled,
    notion_source_id,
    onboarding_status
  )
  VALUES (
    p_brewery_name,
    p_country,
    p_language,
    p_timezone,
    CASE
      WHEN p_country = 'GB' THEN 'GBP'
      WHEN p_country = 'US' THEN 'USD'
      WHEN p_country = 'CA' THEN 'CAD'
      ELSE 'EUR'
    END,
    p_emcs_enabled,
    p_notion_source_id,
    'pending'
  )
  RETURNING id INTO v_brewery_id;

  -- 2. Insert user record linked to the brewery (owner role)
  INSERT INTO users (id, brewery_id, name, email, role)
  VALUES (p_auth_user_id, v_brewery_id, p_user_name, p_user_email, 'owner');

  -- 3. Seed starter packaging formats
  INSERT INTO packaging_formats (brewery_id, name, container_type, size_liters, is_active)
  VALUES
    (v_brewery_id, '30L Keg',     'keg',    30.0,  true),
    (v_brewery_id, '50L Keg',     'keg',    50.0,  true),
    (v_brewery_id, '33cl Bottle', 'bottle',  0.33, true),
    (v_brewery_id, '75cl Bottle', 'bottle',  0.75, true);

  -- 4. Mark onboarding complete
  UPDATE brewery_profiles
  SET onboarding_status = 'complete', updated_at = now()
  WHERE id = v_brewery_id;

  v_result := json_build_object('brewery_id', v_brewery_id, 'already_existed', false);
  RETURN v_result;
END;
$$;

-- Grant execute to the service_role (called server-side only)
GRANT EXECUTE ON FUNCTION provision_brewery TO service_role;
