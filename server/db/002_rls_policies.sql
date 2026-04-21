-- ============================================================
-- Operon BrewOS — Row Level Security Policies
-- Migration: 002_rls_policies
-- All operational tables are scoped to brewery_id from JWT.
-- No application-level filter is needed; the DB enforces isolation.
-- ============================================================

-- ============================================================
-- JWT helper: extract breweryId claim set during auth provisioning
-- (Task #9 sets app_metadata.brewery_id on the Supabase user)
-- ============================================================
CREATE OR REPLACE FUNCTION auth_brewery_id() RETURNS uuid AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'app_metadata' ->> 'brewery_id')::uuid,
    (auth.jwt() ->> 'brewery_id')::uuid
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ============================================================
-- Enable RLS on every table
-- ============================================================
ALTER TABLE brewery_profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE packaging_formats    ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredients          ENABLE ROW LEVEL SECURITY;
ALTER TABLE ingredient_receipts  ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipes              ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_ingredients   ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_mash_steps    ENABLE ROW LEVEL SECURITY;
ALTER TABLE recipe_boil_additions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE batches              ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_inputs         ENABLE ROW LEVEL SECURITY;
ALTER TABLE brew_logs            ENABLE ROW LEVEL SECURITY;
ALTER TABLE mash_steps           ENABLE ROW LEVEL SECURITY;
ALTER TABLE boil_additions       ENABLE ROW LEVEL SECURITY;
ALTER TABLE fermentation_checks  ENABLE ROW LEVEL SECURITY;
ALTER TABLE lots                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales                ENABLE ROW LEVEL SECURITY;
ALTER TABLE declarations         ENABLE ROW LEVEL SECURITY;
ALTER TABLE issues               ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks                ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements  ENABLE ROW LEVEL SECURITY;
ALTER TABLE pending_movements    ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_logs           ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- brewery_profiles: each user can only see their own brewery
-- ============================================================
DROP POLICY IF EXISTS brewery_profiles_select ON brewery_profiles;
CREATE POLICY brewery_profiles_select ON brewery_profiles
  FOR SELECT USING (id = auth_brewery_id());

DROP POLICY IF EXISTS brewery_profiles_update ON brewery_profiles;
CREATE POLICY brewery_profiles_update ON brewery_profiles
  FOR UPDATE USING (id = auth_brewery_id());

-- ============================================================
-- packaging_formats
-- ============================================================
DROP POLICY IF EXISTS packaging_formats_select ON packaging_formats;
CREATE POLICY packaging_formats_select ON packaging_formats
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS packaging_formats_insert ON packaging_formats;
CREATE POLICY packaging_formats_insert ON packaging_formats
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS packaging_formats_update ON packaging_formats;
CREATE POLICY packaging_formats_update ON packaging_formats
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS packaging_formats_delete ON packaging_formats;
CREATE POLICY packaging_formats_delete ON packaging_formats
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- ingredients
-- ============================================================
DROP POLICY IF EXISTS ingredients_select ON ingredients;
CREATE POLICY ingredients_select ON ingredients
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS ingredients_insert ON ingredients;
CREATE POLICY ingredients_insert ON ingredients
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS ingredients_update ON ingredients;
CREATE POLICY ingredients_update ON ingredients
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS ingredients_delete ON ingredients;
CREATE POLICY ingredients_delete ON ingredients
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- ingredient_receipts
-- ============================================================
DROP POLICY IF EXISTS ingredient_receipts_select ON ingredient_receipts;
CREATE POLICY ingredient_receipts_select ON ingredient_receipts
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS ingredient_receipts_insert ON ingredient_receipts;
CREATE POLICY ingredient_receipts_insert ON ingredient_receipts
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS ingredient_receipts_update ON ingredient_receipts;
CREATE POLICY ingredient_receipts_update ON ingredient_receipts
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS ingredient_receipts_delete ON ingredient_receipts;
CREATE POLICY ingredient_receipts_delete ON ingredient_receipts
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- recipes
-- ============================================================
DROP POLICY IF EXISTS recipes_select ON recipes;
CREATE POLICY recipes_select ON recipes
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS recipes_insert ON recipes;
CREATE POLICY recipes_insert ON recipes
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS recipes_update ON recipes;
CREATE POLICY recipes_update ON recipes
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS recipes_delete ON recipes;
CREATE POLICY recipes_delete ON recipes
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- recipe_ingredients (join via recipe brewery scope)
-- ============================================================
DROP POLICY IF EXISTS recipe_ingredients_select ON recipe_ingredients;
CREATE POLICY recipe_ingredients_select ON recipe_ingredients
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_ingredients_insert ON recipe_ingredients;
CREATE POLICY recipe_ingredients_insert ON recipe_ingredients
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_ingredients_update ON recipe_ingredients;
CREATE POLICY recipe_ingredients_update ON recipe_ingredients
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_ingredients_delete ON recipe_ingredients;
CREATE POLICY recipe_ingredients_delete ON recipe_ingredients
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

-- ============================================================
-- recipe_mash_steps
-- ============================================================
DROP POLICY IF EXISTS recipe_mash_steps_select ON recipe_mash_steps;
CREATE POLICY recipe_mash_steps_select ON recipe_mash_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_mash_steps_insert ON recipe_mash_steps;
CREATE POLICY recipe_mash_steps_insert ON recipe_mash_steps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_mash_steps_update ON recipe_mash_steps;
CREATE POLICY recipe_mash_steps_update ON recipe_mash_steps
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_mash_steps_delete ON recipe_mash_steps;
CREATE POLICY recipe_mash_steps_delete ON recipe_mash_steps
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

-- ============================================================
-- recipe_boil_additions
-- ============================================================
DROP POLICY IF EXISTS recipe_boil_additions_select ON recipe_boil_additions;
CREATE POLICY recipe_boil_additions_select ON recipe_boil_additions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_boil_additions_insert ON recipe_boil_additions;
CREATE POLICY recipe_boil_additions_insert ON recipe_boil_additions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_boil_additions_update ON recipe_boil_additions;
CREATE POLICY recipe_boil_additions_update ON recipe_boil_additions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS recipe_boil_additions_delete ON recipe_boil_additions;
CREATE POLICY recipe_boil_additions_delete ON recipe_boil_additions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM recipes r WHERE r.id = recipe_id AND r.brewery_id = auth_brewery_id())
  );

-- ============================================================
-- users
-- ============================================================
DROP POLICY IF EXISTS users_select ON users;
CREATE POLICY users_select ON users
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS users_insert ON users;
CREATE POLICY users_insert ON users
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS users_update ON users;
CREATE POLICY users_update ON users
  FOR UPDATE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- batches
-- ============================================================
DROP POLICY IF EXISTS batches_select ON batches;
CREATE POLICY batches_select ON batches
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS batches_insert ON batches;
CREATE POLICY batches_insert ON batches
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS batches_update ON batches;
CREATE POLICY batches_update ON batches
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS batches_delete ON batches;
CREATE POLICY batches_delete ON batches
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- batch_inputs
-- ============================================================
DROP POLICY IF EXISTS batch_inputs_select ON batch_inputs;
CREATE POLICY batch_inputs_select ON batch_inputs
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS batch_inputs_insert ON batch_inputs;
CREATE POLICY batch_inputs_insert ON batch_inputs
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS batch_inputs_update ON batch_inputs;
CREATE POLICY batch_inputs_update ON batch_inputs
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS batch_inputs_delete ON batch_inputs;
CREATE POLICY batch_inputs_delete ON batch_inputs
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- brew_logs
-- ============================================================
DROP POLICY IF EXISTS brew_logs_select ON brew_logs;
CREATE POLICY brew_logs_select ON brew_logs
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS brew_logs_insert ON brew_logs;
CREATE POLICY brew_logs_insert ON brew_logs
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS brew_logs_update ON brew_logs;
CREATE POLICY brew_logs_update ON brew_logs
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS brew_logs_delete ON brew_logs;
CREATE POLICY brew_logs_delete ON brew_logs
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- mash_steps (via brew_log scope)
-- ============================================================
DROP POLICY IF EXISTS mash_steps_select ON mash_steps;
CREATE POLICY mash_steps_select ON mash_steps
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS mash_steps_insert ON mash_steps;
CREATE POLICY mash_steps_insert ON mash_steps
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS mash_steps_update ON mash_steps;
CREATE POLICY mash_steps_update ON mash_steps
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS mash_steps_delete ON mash_steps;
CREATE POLICY mash_steps_delete ON mash_steps
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

-- ============================================================
-- boil_additions (via brew_log scope)
-- ============================================================
DROP POLICY IF EXISTS boil_additions_select ON boil_additions;
CREATE POLICY boil_additions_select ON boil_additions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS boil_additions_insert ON boil_additions;
CREATE POLICY boil_additions_insert ON boil_additions
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS boil_additions_update ON boil_additions;
CREATE POLICY boil_additions_update ON boil_additions
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS boil_additions_delete ON boil_additions;
CREATE POLICY boil_additions_delete ON boil_additions
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

-- ============================================================
-- fermentation_checks (via brew_log scope)
-- ============================================================
DROP POLICY IF EXISTS fermentation_checks_select ON fermentation_checks;
CREATE POLICY fermentation_checks_select ON fermentation_checks
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS fermentation_checks_insert ON fermentation_checks;
CREATE POLICY fermentation_checks_insert ON fermentation_checks
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS fermentation_checks_update ON fermentation_checks;
CREATE POLICY fermentation_checks_update ON fermentation_checks
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

DROP POLICY IF EXISTS fermentation_checks_delete ON fermentation_checks;
CREATE POLICY fermentation_checks_delete ON fermentation_checks
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM brew_logs bl WHERE bl.id = brew_log_id AND bl.brewery_id = auth_brewery_id())
  );

-- ============================================================
-- lots
-- ============================================================
DROP POLICY IF EXISTS lots_select ON lots;
CREATE POLICY lots_select ON lots
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS lots_insert ON lots;
CREATE POLICY lots_insert ON lots
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS lots_update ON lots;
CREATE POLICY lots_update ON lots
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS lots_delete ON lots;
CREATE POLICY lots_delete ON lots
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- sales
-- ============================================================
DROP POLICY IF EXISTS sales_select ON sales;
CREATE POLICY sales_select ON sales
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS sales_insert ON sales;
CREATE POLICY sales_insert ON sales
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS sales_update ON sales;
CREATE POLICY sales_update ON sales
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS sales_delete ON sales;
CREATE POLICY sales_delete ON sales
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- declarations
-- ============================================================
DROP POLICY IF EXISTS declarations_select ON declarations;
CREATE POLICY declarations_select ON declarations
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS declarations_insert ON declarations;
CREATE POLICY declarations_insert ON declarations
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS declarations_update ON declarations;
CREATE POLICY declarations_update ON declarations
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS declarations_delete ON declarations;
CREATE POLICY declarations_delete ON declarations
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- issues
-- ============================================================
DROP POLICY IF EXISTS issues_select ON issues;
CREATE POLICY issues_select ON issues
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS issues_insert ON issues;
CREATE POLICY issues_insert ON issues
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS issues_update ON issues;
CREATE POLICY issues_update ON issues
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS issues_delete ON issues;
CREATE POLICY issues_delete ON issues
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- tasks
-- ============================================================
DROP POLICY IF EXISTS tasks_select ON tasks;
CREATE POLICY tasks_select ON tasks
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS tasks_insert ON tasks;
CREATE POLICY tasks_insert ON tasks
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS tasks_update ON tasks;
CREATE POLICY tasks_update ON tasks
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS tasks_delete ON tasks;
CREATE POLICY tasks_delete ON tasks
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- inventory_movements (append-only: no UPDATE/DELETE)
-- ============================================================
DROP POLICY IF EXISTS inventory_movements_select ON inventory_movements;
CREATE POLICY inventory_movements_select ON inventory_movements
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS inventory_movements_insert ON inventory_movements;
CREATE POLICY inventory_movements_insert ON inventory_movements
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

-- ============================================================
-- pending_movements
-- ============================================================
DROP POLICY IF EXISTS pending_movements_select ON pending_movements;
CREATE POLICY pending_movements_select ON pending_movements
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS pending_movements_insert ON pending_movements;
CREATE POLICY pending_movements_insert ON pending_movements
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS pending_movements_update ON pending_movements;
CREATE POLICY pending_movements_update ON pending_movements
  FOR UPDATE USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS pending_movements_delete ON pending_movements;
CREATE POLICY pending_movements_delete ON pending_movements
  FOR DELETE USING (brewery_id = auth_brewery_id());

-- ============================================================
-- event_logs (append-only: no UPDATE/DELETE)
-- ============================================================
DROP POLICY IF EXISTS event_logs_select ON event_logs;
CREATE POLICY event_logs_select ON event_logs
  FOR SELECT USING (brewery_id = auth_brewery_id());

DROP POLICY IF EXISTS event_logs_insert ON event_logs;
CREATE POLICY event_logs_insert ON event_logs
  FOR INSERT WITH CHECK (brewery_id = auth_brewery_id());
