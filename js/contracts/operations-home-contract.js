/**
 * Operations (home) screen contract (v1).
 * Action-first payload shape only; no rendering logic.
 */

/** @typedef {{ id: string, title: string, category?: string, priority?: 'high'|'medium'|'low', dueAt?: string, linkedEntityType?: string, linkedEntityId?: string }} OperationAction */
/** @typedef {{ id: string, label: string, entityType: string, entityId: string, requestedAt?: string }} PendingCompletion */
/** @typedef {{ id: string, reason: string, entityType: string, entityId: string, blockingState?: string }} BlockedItem */
/** @typedef {{ id: string, title: string, happenedAt: string, entityType?: string, entityId?: string, severity?: 'info'|'warning'|'critical' }} RecentOperationalEvent */
/** @typedef {{ id: string, declarationType: string, status: string, dueAt?: string, message: string }} DeclarationAlert */
/** @typedef {{ id: string, lotId?: string, ingredientId?: string, message: string, severity: 'warning'|'critical', observedAt?: string }} StockAlert */

/** @typedef {{
 * generatedAt: string,
 * nextActions: OperationAction[],
 * pendingCompletions: PendingCompletion[],
 * blockedItems: BlockedItem[],
 * recentOperationalEvents: RecentOperationalEvent[],
 * declarationAlerts: DeclarationAlert[],
 * stockAlerts: StockAlert[]
 * }} OperationsHomeContract */

function createEmptyOperationsHomeContract() {
  return {
    generatedAt: new Date().toISOString(),
    nextActions: [],
    pendingCompletions: [],
    blockedItems: [],
    recentOperationalEvents: [],
    declarationAlerts: [],
    stockAlerts: [],
  };
}

function normalizeOperationsHomeContract(payload = {}) {
  const base = createEmptyOperationsHomeContract();
  return {
    ...base,
    ...payload,
    nextActions: Array.isArray(payload.nextActions) ? payload.nextActions : base.nextActions,
    pendingCompletions: Array.isArray(payload.pendingCompletions) ? payload.pendingCompletions : base.pendingCompletions,
    blockedItems: Array.isArray(payload.blockedItems) ? payload.blockedItems : base.blockedItems,
    recentOperationalEvents: Array.isArray(payload.recentOperationalEvents) ? payload.recentOperationalEvents : base.recentOperationalEvents,
    declarationAlerts: Array.isArray(payload.declarationAlerts) ? payload.declarationAlerts : base.declarationAlerts,
    stockAlerts: Array.isArray(payload.stockAlerts) ? payload.stockAlerts : base.stockAlerts,
  };
}
