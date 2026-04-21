// ── Operon BrewOS — Canonical Domain Types ──
// Source of truth for all entities in the operational chain.
// Refined in the database schema task; used here to scaffold the component tree.

// ── Enumerations ──

export type BatchStatus =
  | "planned"
  | "brewing"
  | "fermenting"
  | "conditioning"
  | "ready"
  | "packaged"
  | "closed";

export type UserRole =
  | "owner"
  | "brewmaster_admin"
  | "finance"
  | "brewer"
  | "assistant"
  | "viewer";

export type LotType = "batch_output" | "packaged" | "adjustment" | "transfer_in";
export type LotStatus = "active" | "depleted" | "archived";
export type PackagingState = "unpackaged" | "packaged" | "mixed";
export type ExciseState = "not_applicable" | "pending" | "submitted" | "cleared";
export type MovementDirection = "in" | "out" | "internal";
export type ResolutionStatus = "pending" | "resolved" | "eliminated";
export type TaskPriority = "low" | "medium" | "high" | "critical";
export type TaskStatus = "pending" | "in_progress" | "completed" | "archived";
export type IssueSeverity = "low" | "medium" | "high" | "critical";
export type EventCategory =
  | "batch"
  | "inventory"
  | "packaging"
  | "sales"
  | "task"
  | "issue"
  | "declaration"
  | "user"
  | "system";

// ── Brewery Profile ──

export interface BreweryProfile {
  id: string;
  slug: string;
  name: string;
  country: string;
  locale: string;
  currency: string;
  timezone: string;
  annualProductionLimitL: number | null;
  exciseRegistrationNumber: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// ── User ──

export interface User {
  id: string;
  breweryId: string;
  email: string;
  displayName: string | null;
  role: UserRole;
  isActive: boolean;
  lastSeenAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Recipe ──

export interface RecipeMalt {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredientName?: string;
  quantityKg: number;
  colorEbc: number | null;
  sortOrder: number;
}

export interface RecipeHop {
  id: string;
  recipeId: string;
  ingredientId: string;
  ingredientName?: string;
  quantityG: number;
  alphaAcidPct: number | null;
  additionTimeMin: number | null;
  sortOrder: number;
}

export interface RecipeMashStep {
  id: string;
  recipeId: string;
  tempC: number;
  durationMin: number;
  notes: string | null;
  sortOrder: number;
}

export interface Recipe {
  id: string;
  breweryId: string;
  name: string;
  style: string | null;
  targetOg: number | null;
  targetFg: number | null;
  targetAbvPct: number | null;
  targetIbu: number | null;
  targetColorEbc: number | null;
  mashTempC: number | null;
  boilDurationMin: number | null;
  preboilVolumeL: number | null;
  postboilVolumeL: number | null;
  notes: string | null;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
  malts?: RecipeMalt[];
  hops?: RecipeHop[];
  mashSteps?: RecipeMashStep[];
}

// ── Batch ──

export interface BatchInput {
  id: string;
  batchId: string;
  ingredientId: string;
  ingredientName?: string;
  plannedQuantityKg: number | null;
  actualQuantityKg: number | null;
  lotNumber: string | null;
  notes: string | null;
}

export interface MashStep {
  id: string;
  batchId: string;
  tempC: number;
  durationMin: number;
  actualTempC: number | null;
  completedAt: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface BoilAddition {
  id: string;
  batchId: string;
  ingredientId: string;
  ingredientName?: string;
  quantityG: number;
  additionTimeMin: number | null;
  addedAt: string | null;
  notes: string | null;
  sortOrder: number;
}

export interface FermentationCheck {
  id: string;
  batchId: string;
  checkedAt: string;
  gravity: number | null;
  tempC: number | null;
  ph: number | null;
  notes: string | null;
}

export interface BrewLog {
  id: string;
  batchId: string;
  loggedAt: string;
  stage: string;
  value: number | null;
  unit: string | null;
  notes: string | null;
}

export interface Batch {
  id: string;
  breweryId: string;
  recipeId: string | null;
  recipeName?: string;
  batchNumber: string | null;
  declarationNumber: string | null;
  displayName: string | null;
  status: BatchStatus;
  brewDate: string | null;
  packageDate: string | null;
  volumeBrewedL: number | null;
  volumePackagedL: number | null;
  actualOg: number | null;
  actualFg: number | null;
  actualAbvPct: number | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  inputs?: BatchInput[];
  mashSteps?: MashStep[];
  boilAdditions?: BoilAddition[];
  fermentationChecks?: FermentationCheck[];
  brewLogs?: BrewLog[];
}

// ── Inventory / Lots ──

export interface Ingredient {
  id: string;
  breweryId: string;
  name: string;
  category: "malt" | "hop" | "yeast" | "adjunct" | "finings" | "other";
  unit: string;
  currentStockKg: number | null;
  notes: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Lot {
  id: string;
  breweryId: string;
  batchId: string | null;
  lotType: LotType;
  status: LotStatus;
  volumeL: number;
  packagingState: PackagingState;
  exciseState: ExciseState;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Packaging ──

export interface PackagingFormat {
  id: string;
  breweryId: string;
  name: string;
  volumeL: number;
  containerType: string;
  isActive: boolean;
}

// ── Sales & Declarations ──

export interface Sale {
  id: string;
  breweryId: string;
  lotId: string | null;
  saleDate: string;
  volumeL: number;
  pricePerL: number | null;
  buyerName: string | null;
  notes: string | null;
  createdAt: string;
}

export interface Declaration {
  id: string;
  breweryId: string;
  batchId: string | null;
  periodStart: string;
  periodEnd: string;
  volumeL: number;
  exciseState: ExciseState;
  submittedAt: string | null;
  notes: string | null;
  createdAt: string;
}

// ── Movements ──

export interface InventoryMovement {
  id: string;
  breweryId: string;
  ingredientId: string | null;
  lotId: string | null;
  direction: MovementDirection;
  quantityKg: number | null;
  volumeL: number | null;
  movedAt: string;
  reason: string | null;
  notes: string | null;
  createdAt: string;
}

export interface PendingMovement {
  id: string;
  breweryId: string;
  ingredientId: string | null;
  lotId: string | null;
  direction: MovementDirection;
  quantityKg: number | null;
  volumeL: number | null;
  scheduledFor: string | null;
  resolvedAt: string | null;
  resolutionStatus: ResolutionStatus;
  notes: string | null;
  createdAt: string;
}

// ── Tasks & Issues ──

export interface Task {
  id: string;
  breweryId: string;
  batchId: string | null;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  assignedTo: string | null;
  dueDate: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Issue {
  id: string;
  breweryId: string;
  batchId: string | null;
  title: string;
  description: string | null;
  severity: IssueSeverity;
  resolutionStatus: ResolutionStatus;
  resolvedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// ── Event Log ──

export interface EventLog {
  id: string;
  breweryId: string;
  userId: string | null;
  category: EventCategory;
  entityType: string | null;
  entityId: string | null;
  action: string;
  payload: Record<string, unknown> | null;
  createdAt: string;
}

// ── Semantic Layer (Notion contract objects) ──

export interface SemanticEntityFlags {
  active: boolean;
  isReadinessDriver: boolean;
  requiresDispatch: boolean;
  requiresClosure: boolean;
  tracksDensity: boolean;
  appComputed: boolean;
  [key: string]: boolean;
}

export interface SemanticEntityAirtable {
  target: string | null;
  fieldName: string | null;
}

export interface SemanticEntity {
  id: string;
  key: string;
  name: string;
  description: string | null;
  layer: string | null;
  memoryLayer: string | null;
  entityClass: string | null;
  canonicalObjectType: string | null;
  canonicalWorkflowType: string | null;
  ruleGroup: string | null;
  appRole: string | null;
  workspaceRole: string | null;
  entityId: string | null;
  displayLabel: string | null;
  localAlias: string | null;
  semanticConfidence: number | null;
  sourceNote: string | null;
  flags: SemanticEntityFlags;
  airtable: SemanticEntityAirtable;
  status: string | null;
  createdTime: string;
  lastEditedTime: string;
}

export interface SemanticLink {
  id: string;
  variant: string | null;
  name: string | null;
  relationType: string;
  source: { ids: string[]; key: string };
  target: { ids: string[]; key: string };
  weight: number | null;
  confidence: number | null;
  note: string | null;
  description: string | null;
  status: string | null;
  createdTime: string;
  lastEditedTime: string;
}

export interface SemanticGraph {
  entities: SemanticEntity[];
  links: SemanticLink[];
}

// ── Permissions ──

export type Permission =
  | "batches:read"
  | "batches:write"
  | "recipes:read"
  | "recipes:write"
  | "inventory:read"
  | "inventory:write"
  | "sales:read"
  | "sales:write"
  | "declarations:read"
  | "declarations:write"
  | "settings:read"
  | "settings:write"
  | "users:read"
  | "users:write";

export type PermissionMap = Record<Permission, boolean>;
