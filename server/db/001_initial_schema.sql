-- ============================================================
-- Operon BrewOS — Initial Operational Schema
-- Migration: 001_initial_schema
-- Architecture: multi-brewery, brewery_id on every table
-- ============================================================

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ENUMS
-- ============================================================

DO $$ BEGIN
  CREATE TYPE batch_status AS ENUM (
    'planned', 'brewing', 'fermenting', 'conditioning', 'ready', 'packaged', 'closed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE user_role AS ENUM (
    'owner', 'brewmaster_admin', 'brewer', 'assistant', 'viewer'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lot_type AS ENUM (
    'batch_output', 'packaged', 'adjustment', 'transfer_in'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE lot_status AS ENUM (
    'active', 'depleted', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE packaging_state AS ENUM (
    'unpackaged', 'packaged', 'mixed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE excise_state AS ENUM (
    'not_applicable', 'pending', 'submitted', 'cleared'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE movement_direction AS ENUM (
    'in', 'out', 'internal'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE resolution_status AS ENUM (
    'pending', 'resolved', 'eliminated'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority AS ENUM (
    'low', 'medium', 'high', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_status AS ENUM (
    'pending', 'in_progress', 'completed', 'archived'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE issue_severity AS ENUM (
    'low', 'medium', 'high', 'critical'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE issue_status AS ENUM (
    'open', 'in_progress', 'resolved', 'dismissed'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE declaration_status AS ENUM (
    'draft', 'submitted', 'accepted', 'rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE sale_status AS ENUM (
    'pending', 'confirmed', 'shipped', 'invoiced', 'paid', 'cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 1. BREWERY PROFILES — tenant root
-- ============================================================
CREATE TABLE IF NOT EXISTS brewery_profiles (
  id                            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  name                          text        NOT NULL,
  legal_name                    text,
  display_name                  text,
  country                       text,
  timezone                      text        NOT NULL DEFAULT 'UTC',
  currency                      text        NOT NULL DEFAULT 'EUR',
  language                      text        NOT NULL DEFAULT 'en',
  vat_number                    text,
  excise_authorization_number   text,
  is_small_independent_brewery  boolean     NOT NULL DEFAULT false,
  emcs_enabled                  boolean     NOT NULL DEFAULT false,
  packaging_contribution_mode   text,
  onboarding_status             text        NOT NULL DEFAULT 'pending',
  created_at                    timestamptz NOT NULL DEFAULT now(),
  updated_at                    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 2. PACKAGING FORMATS
-- ============================================================
CREATE TABLE IF NOT EXISTS packaging_formats (
  id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id                      uuid        NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  name                            text        NOT NULL,
  container_type                  text        NOT NULL,
  package_size_label              text,
  size_liters                     numeric(8,4) NOT NULL,
  is_reusable                     boolean     NOT NULL DEFAULT false,
  packaging_contribution_category text,
  is_active                       boolean     NOT NULL DEFAULT true,
  notes                           text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS packaging_formats_brewery_id_idx ON packaging_formats(brewery_id);

-- ============================================================
-- 3. INGREDIENTS — input master
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredients (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id   uuid        NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  name         text        NOT NULL,
  category     text,
  default_unit text,
  is_active    boolean     NOT NULL DEFAULT true,
  created_at   timestamptz NOT NULL DEFAULT now(),
  updated_at   timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ingredients_brewery_id_idx ON ingredients(brewery_id);

-- ============================================================
-- 4. INGREDIENT RECEIPTS — supplier-lot traceability
-- ============================================================
CREATE TABLE IF NOT EXISTS ingredient_receipts (
  id                  uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id          uuid        NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  ingredient_id       uuid        NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  supplier_name       text,
  supplier_lot_number text,
  internal_lot_code   text,
  quantity_received   numeric(12,4) NOT NULL,
  unit                text        NOT NULL,
  received_date       date,
  best_before_date    date,
  quality_status      text        NOT NULL DEFAULT 'approved',
  storage_location    text,
  notes               text,
  created_at          timestamptz NOT NULL DEFAULT now(),
  updated_at          timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ingredient_receipts_brewery_id_idx  ON ingredient_receipts(brewery_id);
CREATE INDEX IF NOT EXISTS ingredient_receipts_ingredient_id_idx ON ingredient_receipts(ingredient_id);

-- ============================================================
-- 5. RECIPES — plan layer (NEVER overwritten by execution)
-- ============================================================
CREATE TABLE IF NOT EXISTS recipes (
  id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id                      uuid        NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  name                            text        NOT NULL,
  default_batch_size_liters       numeric(10,4),
  target_og                       numeric(6,4),
  target_fg                       numeric(6,4),
  target_pre_boil_volume_liters   numeric(10,4),
  target_post_boil_volume_liters  numeric(10,4),
  target_fermenter_volume_liters  numeric(10,4),
  default_boil_duration_min       integer,
  default_yeast_notes             text,
  default_packaging_type          text,
  default_packaging_format_id     uuid        REFERENCES packaging_formats(id) ON DELETE SET NULL,
  is_active                       boolean     NOT NULL DEFAULT true,
  notes                           text,
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recipes_brewery_id_idx ON recipes(brewery_id);

-- ============================================================
-- 6. RECIPE INGREDIENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_ingredients (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id uuid        NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  suggested_quantity numeric(12,4),
  unit          text,
  stage         text,
  sort_order    integer     NOT NULL DEFAULT 0,
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recipe_ingredients_recipe_id_idx     ON recipe_ingredients(recipe_id);
CREATE INDEX IF NOT EXISTS recipe_ingredients_ingredient_id_idx ON recipe_ingredients(ingredient_id);

-- ============================================================
-- 7. RECIPE MASH STEPS
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_mash_steps (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id     uuid        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  step_order    integer     NOT NULL DEFAULT 0,
  stage         text,
  target_temp_c numeric(5,2),
  duration_min  integer,
  target_ph     numeric(4,2),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recipe_mash_steps_recipe_id_idx ON recipe_mash_steps(recipe_id);

-- ============================================================
-- 8. RECIPE BOIL ADDITIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS recipe_boil_additions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  recipe_id       uuid        NOT NULL REFERENCES recipes(id) ON DELETE CASCADE,
  ingredient_id   uuid        REFERENCES ingredients(id) ON DELETE SET NULL,
  step_order      integer     NOT NULL DEFAULT 0,
  addition_stage  text,
  time_min        integer,
  quantity        numeric(12,4),
  unit            text,
  addition_type   text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS recipe_boil_additions_recipe_id_idx ON recipe_boil_additions(recipe_id);

-- ============================================================
-- 9. USERS
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id  uuid        NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  name        text        NOT NULL,
  email       text        NOT NULL,
  role        user_role   NOT NULL DEFAULT 'viewer',
  is_active   boolean     NOT NULL DEFAULT true,
  created_at  timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (brewery_id, email)
);
CREATE INDEX IF NOT EXISTS users_brewery_id_idx ON users(brewery_id);

-- ============================================================
-- 10. BATCHES — core process run object
-- ============================================================
CREATE TABLE IF NOT EXISTS batches (
  id                   uuid         PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id           uuid         NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  batch_number         text,
  declaration_number   text,
  recipe_id            uuid         REFERENCES recipes(id) ON DELETE SET NULL,
  brew_date            date,
  status               batch_status NOT NULL DEFAULT 'planned',
  target_volume_liters numeric(10,4),
  actual_volume_liters numeric(10,4),
  notes                text,
  created_at           timestamptz  NOT NULL DEFAULT now(),
  updated_at           timestamptz  NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS batches_brewery_id_idx ON batches(brewery_id);
CREATE INDEX IF NOT EXISTS batches_recipe_id_idx  ON batches(recipe_id);
CREATE INDEX IF NOT EXISTS batches_status_idx     ON batches(status);

-- ============================================================
-- 11. BATCH INPUTS — actual material usage
-- ============================================================
CREATE TABLE IF NOT EXISTS batch_inputs (
  id                    uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id            uuid        NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  batch_id              uuid        NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  ingredient_id         uuid        NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  ingredient_receipt_id uuid        REFERENCES ingredient_receipts(id) ON DELETE SET NULL,
  quantity              numeric(12,4) NOT NULL,
  unit                  text        NOT NULL,
  stage                 text,
  used_at               timestamptz,
  created_at            timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS batch_inputs_brewery_id_idx    ON batch_inputs(brewery_id);
CREATE INDEX IF NOT EXISTS batch_inputs_batch_id_idx      ON batch_inputs(batch_id);
CREATE INDEX IF NOT EXISTS batch_inputs_ingredient_id_idx ON batch_inputs(ingredient_id);

-- ============================================================
-- 12. BREW LOGS — execution reality (separate from recipe plan)
-- ============================================================
CREATE TABLE IF NOT EXISTS brew_logs (
  id                              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id                      uuid        NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  batch_id                        uuid        NOT NULL REFERENCES batches(id) ON DELETE CASCADE,
  brew_date                       date,
  actual_mash_volume_liters       numeric(10,4),
  actual_strike_water_temp_c      numeric(5,2),
  actual_pre_boil_volume_liters   numeric(10,4),
  actual_post_boil_volume_liters  numeric(10,4),
  actual_boil_duration_min        integer,
  actual_fermenter_volume_liters  numeric(10,4),
  yeast_pitch_temp_c              numeric(5,2),
  yeast_notes                     text,
  packaged_date                   date,
  packaged_volume_liters          numeric(10,4),
  packaging_format_id             uuid        REFERENCES packaging_formats(id) ON DELETE SET NULL,
  exceptions                      text,
  brewer_notes                    text,
  log_status                      text        NOT NULL DEFAULT 'in_progress',
  created_at                      timestamptz NOT NULL DEFAULT now(),
  updated_at                      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS brew_logs_brewery_id_idx ON brew_logs(brewery_id);
CREATE INDEX IF NOT EXISTS brew_logs_batch_id_idx   ON brew_logs(batch_id);

-- ============================================================
-- 13. MASH STEPS — actual execution (linked to brew log)
-- ============================================================
CREATE TABLE IF NOT EXISTS mash_steps (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brew_log_id   uuid        NOT NULL REFERENCES brew_logs(id) ON DELETE CASCADE,
  step_order    integer     NOT NULL DEFAULT 0,
  stage         text,
  target_temp_c numeric(5,2),
  actual_temp_c numeric(5,2),
  duration_min  integer,
  ph_actual     numeric(4,2),
  notes         text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS mash_steps_brew_log_id_idx ON mash_steps(brew_log_id);

-- ============================================================
-- 14. BOIL ADDITIONS — actual execution (linked to brew log)
-- ============================================================
CREATE TABLE IF NOT EXISTS boil_additions (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brew_log_id     uuid        NOT NULL REFERENCES brew_logs(id) ON DELETE CASCADE,
  step_order      integer     NOT NULL DEFAULT 0,
  ingredient_id   uuid        REFERENCES ingredients(id) ON DELETE SET NULL,
  time_min        integer,
  quantity        numeric(12,4),
  unit            text,
  addition_type   text,
  addition_stage  text,
  notes           text,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS boil_additions_brew_log_id_idx ON boil_additions(brew_log_id);

-- ============================================================
-- 15. FERMENTATION CHECKS — actual observations over time
-- ============================================================
CREATE TABLE IF NOT EXISTS fermentation_checks (
  id            uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brew_log_id   uuid        NOT NULL REFERENCES brew_logs(id) ON DELETE CASCADE,
  check_date    date        NOT NULL,
  check_time    time,
  day_number    integer,
  gravity       numeric(6,4),
  temperature_c numeric(5,2),
  ph            numeric(4,2),
  sensory_notes text,
  check_type    text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fermentation_checks_brew_log_id_idx ON fermentation_checks(brew_log_id);
CREATE INDEX IF NOT EXISTS fermentation_checks_check_date_idx  ON fermentation_checks(check_date);

-- ============================================================
-- 16. LOTS — output inventory / traceability unit
-- ============================================================
CREATE TABLE IF NOT EXISTS lots (
  id                   uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id           uuid           NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  batch_id             uuid           REFERENCES batches(id) ON DELETE SET NULL,
  parent_lot_id        uuid           REFERENCES lots(id) ON DELETE SET NULL,
  packaging_format_id  uuid           REFERENCES packaging_formats(id) ON DELETE SET NULL,
  lot_number           text           NOT NULL,
  internal_lot_ref     text,
  lot_type             lot_type       NOT NULL DEFAULT 'batch_output',
  status               lot_status     NOT NULL DEFAULT 'active',
  packaging_state      packaging_state NOT NULL DEFAULT 'unpackaged',
  excise_state         excise_state   NOT NULL DEFAULT 'not_applicable',
  volume_liters        numeric(12,4),
  units_count          integer,
  lot_date             date,
  notes                text,
  created_at           timestamptz    NOT NULL DEFAULT now(),
  updated_at           timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS lots_brewery_id_idx    ON lots(brewery_id);
CREATE INDEX IF NOT EXISTS lots_batch_id_idx      ON lots(batch_id);
CREATE INDEX IF NOT EXISTS lots_parent_lot_id_idx ON lots(parent_lot_id);
CREATE INDEX IF NOT EXISTS lots_status_idx        ON lots(status);

-- ============================================================
-- 17. SALES
-- ============================================================
CREATE TABLE IF NOT EXISTS sales (
  id                 uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id         uuid           NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  lot_id             uuid           REFERENCES lots(id) ON DELETE SET NULL,
  customer           text           NOT NULL,
  sale_date          date,
  volume_sold        numeric(12,4),
  unit               text,
  invoice_number     text,
  status             sale_status    NOT NULL DEFAULT 'pending',
  due_date           date,
  amount             numeric(14,2),
  currency           text           NOT NULL DEFAULT 'EUR',
  excise_mode        text,
  arc_reference      text,
  emcs_reference     text,
  stock_direction    movement_direction NOT NULL DEFAULT 'out',
  elimination_reason text,
  notes              text,
  created_at         timestamptz    NOT NULL DEFAULT now(),
  updated_at         timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sales_brewery_id_idx ON sales(brewery_id);
CREATE INDEX IF NOT EXISTS sales_lot_id_idx     ON sales(lot_id);
CREATE INDEX IF NOT EXISTS sales_status_idx     ON sales(status);

-- ============================================================
-- 18. DECLARATIONS — compliance grouping
-- ============================================================
CREATE TABLE IF NOT EXISTS declarations (
  id                  uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id          uuid               NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  declaration_number  text,
  declaration_type    text               NOT NULL,
  period_start        date               NOT NULL,
  period_end          date               NOT NULL,
  submission_date     date,
  status              declaration_status NOT NULL DEFAULT 'draft',
  reference_number    text,
  notes               text,
  created_at          timestamptz        NOT NULL DEFAULT now(),
  updated_at          timestamptz        NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS declarations_brewery_id_idx ON declarations(brewery_id);
CREATE INDEX IF NOT EXISTS declarations_status_idx     ON declarations(status);

-- ============================================================
-- 19. ISSUES — incident / problem capture
-- ============================================================
CREATE TABLE IF NOT EXISTS issues (
  id               uuid           PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id       uuid           NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  title            text           NOT NULL,
  issue_date       date,
  severity         issue_severity NOT NULL DEFAULT 'medium',
  status           issue_status   NOT NULL DEFAULT 'open',
  description      text,
  linked_batch_id  uuid           REFERENCES batches(id) ON DELETE SET NULL,
  linked_lot_id    uuid           REFERENCES lots(id) ON DELETE SET NULL,
  linked_sale_id   uuid           REFERENCES sales(id) ON DELETE SET NULL,
  created_at       timestamptz    NOT NULL DEFAULT now(),
  updated_at       timestamptz    NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS issues_brewery_id_idx ON issues(brewery_id);
CREATE INDEX IF NOT EXISTS issues_status_idx     ON issues(status);

-- ============================================================
-- 20. INVENTORY MOVEMENTS — authoritative stock ledger
--     (append-only; no updated_at)
--     source_pending_movement_id FK added after pending_movements
-- ============================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id                       uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id               uuid               NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  movement_timestamp       timestamptz        NOT NULL DEFAULT now(),
  movement_type            text               NOT NULL,
  scope                    text,
  ingredient_id            uuid               REFERENCES ingredients(id) ON DELETE SET NULL,
  ingredient_receipt_id    uuid               REFERENCES ingredient_receipts(id) ON DELETE SET NULL,
  lot_id                   uuid               REFERENCES lots(id) ON DELETE SET NULL,
  source_lot_id            uuid               REFERENCES lots(id) ON DELETE SET NULL,
  destination_lot_id       uuid               REFERENCES lots(id) ON DELETE SET NULL,
  batch_id                 uuid               REFERENCES batches(id) ON DELETE SET NULL,
  sale_id                  uuid               REFERENCES sales(id) ON DELETE SET NULL,
  quantity                 numeric(14,4)      NOT NULL,
  unit                     text               NOT NULL,
  base_quantity_liters     numeric(14,6),
  base_quantity_kg         numeric(14,6),
  direction                movement_direction NOT NULL,
  excise_effect            boolean            NOT NULL DEFAULT false,
  reference_number         text,
  reason                   text,
  notes                    text,
  source_pending_movement_id uuid,
  elimination_reason       text,
  created_at               timestamptz        NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS inventory_movements_brewery_id_idx      ON inventory_movements(brewery_id);
CREATE INDEX IF NOT EXISTS inventory_movements_batch_id_idx        ON inventory_movements(batch_id);
CREATE INDEX IF NOT EXISTS inventory_movements_lot_id_idx          ON inventory_movements(lot_id);
CREATE INDEX IF NOT EXISTS inventory_movements_movement_type_idx   ON inventory_movements(movement_type);
CREATE INDEX IF NOT EXISTS inventory_movements_movement_ts_idx     ON inventory_movements(movement_timestamp);

-- ============================================================
-- 21. TASKS — self-healing operational follow-up system
--     linked_pending_movement_id FK added after pending_movements
-- ============================================================
CREATE TABLE IF NOT EXISTS tasks (
  id                        uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id                uuid          NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  title                     text          NOT NULL,
  due_date                  date,
  scheduled_time            timestamptz,
  priority                  task_priority NOT NULL DEFAULT 'medium',
  status                    task_status   NOT NULL DEFAULT 'pending',
  type                      text,
  notes                     text,
  suggestion_type           text,
  suggestion_reason         text,
  is_system_generated       boolean       NOT NULL DEFAULT false,
  relevance_score           numeric(5,2),
  source                    text,
  deduplication_key         text          UNIQUE,
  linked_issue_id           uuid          REFERENCES issues(id) ON DELETE SET NULL,
  linked_batch_id           uuid          REFERENCES batches(id) ON DELETE SET NULL,
  linked_sale_id            uuid          REFERENCES sales(id) ON DELETE SET NULL,
  linked_pending_movement_id uuid,
  completed_at              timestamptz,
  is_archived               boolean       NOT NULL DEFAULT false,
  is_deleted                boolean       NOT NULL DEFAULT false,
  created_at                timestamptz   NOT NULL DEFAULT now(),
  updated_at                timestamptz   NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS tasks_brewery_id_idx         ON tasks(brewery_id);
CREATE INDEX IF NOT EXISTS tasks_status_idx             ON tasks(status);
CREATE INDEX IF NOT EXISTS tasks_due_date_idx           ON tasks(due_date);
CREATE INDEX IF NOT EXISTS tasks_is_system_generated_idx ON tasks(is_system_generated);

-- ============================================================
-- 22. PENDING MOVEMENTS — first-class staging for incomplete events
-- ============================================================
CREATE TABLE IF NOT EXISTS pending_movements (
  id                    uuid               PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id            uuid               NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  pending_type          text               NOT NULL,
  scope                 text,
  ingredient_id         uuid               REFERENCES ingredients(id) ON DELETE SET NULL,
  ingredient_receipt_id uuid               REFERENCES ingredient_receipts(id) ON DELETE SET NULL,
  batch_id              uuid               REFERENCES batches(id) ON DELETE SET NULL,
  lot_id                uuid               REFERENCES lots(id) ON DELETE SET NULL,
  source_lot_id         uuid               REFERENCES lots(id) ON DELETE SET NULL,
  destination_lot_id    uuid               REFERENCES lots(id) ON DELETE SET NULL,
  sale_id               uuid               REFERENCES sales(id) ON DELETE SET NULL,
  quantity              numeric(14,4),
  unit                  text,
  direction             movement_direction,
  missing_fields_summary text,
  why_completion_matters text,
  resolution_status     resolution_status  NOT NULL DEFAULT 'pending',
  completion_notes      text,
  elimination_reason    text,
  linked_task_id        uuid               REFERENCES tasks(id) ON DELETE SET NULL,
  created_at            timestamptz        NOT NULL DEFAULT now(),
  updated_at            timestamptz        NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS pending_movements_brewery_id_idx       ON pending_movements(brewery_id);
CREATE INDEX IF NOT EXISTS pending_movements_resolution_status_idx ON pending_movements(resolution_status);
CREATE INDEX IF NOT EXISTS pending_movements_batch_id_idx         ON pending_movements(batch_id);

-- ============================================================
-- 23. EVENT LOGS — auditable system event layer (append-only)
-- ============================================================
CREATE TABLE IF NOT EXISTS event_logs (
  id              uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  brewery_id      uuid        NOT NULL REFERENCES brewery_profiles(id) ON DELETE RESTRICT,
  actor_user_id   uuid        REFERENCES users(id) ON DELETE SET NULL,
  actor_role      user_role,
  event_type      text        NOT NULL,
  object_type     text,
  object_id       uuid,
  related_ids     jsonb,
  event_timestamp timestamptz NOT NULL DEFAULT now(),
  summary         text,
  payload_json    jsonb,
  created_at      timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS event_logs_brewery_id_idx     ON event_logs(brewery_id);
CREATE INDEX IF NOT EXISTS event_logs_event_type_idx     ON event_logs(event_type);
CREATE INDEX IF NOT EXISTS event_logs_event_timestamp_idx ON event_logs(event_timestamp);
CREATE INDEX IF NOT EXISTS event_logs_object_idx         ON event_logs(object_type, object_id);

-- ============================================================
-- CIRCULAR FOREIGN KEYS
-- (added after both tables exist; safe to re-run)
-- ============================================================

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'tasks_linked_pending_movement_id_fkey'
  ) THEN
    ALTER TABLE tasks
      ADD CONSTRAINT tasks_linked_pending_movement_id_fkey
      FOREIGN KEY (linked_pending_movement_id) REFERENCES pending_movements(id) ON DELETE SET NULL;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'inventory_movements_source_pending_movement_id_fkey'
  ) THEN
    ALTER TABLE inventory_movements
      ADD CONSTRAINT inventory_movements_source_pending_movement_id_fkey
      FOREIGN KEY (source_pending_movement_id) REFERENCES pending_movements(id) ON DELETE SET NULL;
  END IF;
END $$;

-- ============================================================
-- UPDATED_AT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$ DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY[
    'brewery_profiles', 'packaging_formats', 'ingredients',
    'ingredient_receipts', 'recipes', 'users', 'batches',
    'brew_logs', 'lots', 'sales', 'declarations',
    'pending_movements', 'issues', 'tasks'
  ] LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON %I;
       CREATE TRIGGER set_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at();', t, t
    );
  END LOOP;
END $$;
