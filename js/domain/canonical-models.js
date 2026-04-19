/**
 * Canonical domain foundation (Level 4 alignment).
 * This file intentionally defines stable naming + shape only.
 */

/** @typedef {{ id: string, legalName?: string, displayName?: string, taxIdentifier?: string, facilityAddress?: string, locale?: string, timezone?: string }} BreweryProfile */
/** @typedef {{ id: string, code: string, label: string, unit: 'L'|'ML'|'KG'|'G'|'UNIT', nominalVolume?: number, tareWeight?: number, active?: boolean }} PackagingFormat */
/** @typedef {{ id: string, name: string, category: 'malt'|'hop'|'yeast'|'adjunct'|'other', supplierLotRef?: string, internalLotRef?: string, quantityOnHand?: number, unit?: string, expiryDate?: string, traceabilityRefs?: string[] }} Ingredient */
/** @typedef {{ id: string, name: string, version?: string, style?: string, targetVolumeLiters?: number, targetOriginalGravity?: number, targetFinalGravity?: number, ingredientRefs?: string[] }} Receipt */
/** @typedef {{ id: string, breweryProfileId?: string, receiptId?: string, batchCode?: string, status?: string, plannedStartAt?: string, startedAt?: string, endedAt?: string, targetPackagingFormatId?: string, readinessState?: string }} Batch */
/** @typedef {{ id: string, batchId: string, stage: string, occurredAt: string, actorId?: string, notes?: string, measurements?: Record<string, string|number|boolean> }} BrewLog */
/** @typedef {{ id: string, batchId?: string, lotCode: string, kind: 'input'|'output', quantity: number, unit: string, packagingFormatId?: string, producedAt?: string, expiresAt?: string }} Lot */
/** @typedef {{ id: string, sourceLotId?: string, destinationLotId?: string, quantity: number, unit: string, reason: string, requestedAt: string, requestedBy?: string, requiresConfirmation: boolean }} PendingMovement */
/** @typedef {{ id: string, lotId: string, direction: 'in'|'out'|'adjustment', quantity: number, unit: string, occurredAt: string, reason: string, referenceId?: string }} InventoryMovement */
/** @typedef {{ id: string, saleRef: string, soldAt: string, customerRef?: string, lotAllocations: Array<{ lotId: string, quantity: number, unit: string }>, declarationImpactRef?: string }} Sale */
/** @typedef {{ id: string, declarationType: string, periodStart: string, periodEnd: string, status: 'draft'|'pending'|'submitted'|'accepted'|'rejected', submittedAt?: string, authorityRef?: string, totals?: Record<string, number> }} Declaration */
/** @typedef {{ id: string, entityType: string, entityId: string, eventType: string, happenedAt: string, actorId?: string, metadata?: Record<string, string|number|boolean> }} EventLog */

const CANONICAL_DOMAIN_MODELS = Object.freeze([
  'BreweryProfile',
  'PackagingFormat',
  'Ingredient',
  'Receipt',
  'Batch',
  'BrewLog',
  'Lot',
  'PendingMovement',
  'InventoryMovement',
  'Sale',
  'Declaration',
  'EventLog',
]);
