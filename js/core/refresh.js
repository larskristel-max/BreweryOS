const REFRESHABLE_MAIN_SCREENS = new Set([
  'screen-home',
  'screen-batches',
  'screen-agenda',
  'screen-tasks',
  'screen-financial',
]);

const PULL_TO_REFRESH_CONFIG = {
  activateDistance: 8,
  triggerDistance: 78,
  maxPullDistance: 132,
};

let lastRefreshBatchRecords = [];
let refreshInFlightPromise = null;

const pullRefreshState = {
  tracking: false,
  pulling: false,
  startY: 0,
  distance: 0,
  activeScreen: null,
  activeScrollEl: null,
  activeSurfaceEl: null,
};

function getCurrentScreenId() {
  const stacked = Array.isArray(screenStack) && screenStack.length
    ? screenStack[screenStack.length - 1]
    : null;
  if (stacked) return stacked;

  const visible = Array.from(document.querySelectorAll('[id^="screen-"]'))
    .find((el) => getComputedStyle(el).display !== 'none');
  return visible?.id || 'screen-home';
}

function getActiveAgendaScrollContainer() {
  const candidates = ['agenda-list', 'agenda-week-view', 'agenda-month-view'];
  return candidates
    .map((id) => document.getElementById(id))
    .find((el) => el && getComputedStyle(el).display !== 'none') || null;
}

function getRefreshInteractionContext() {
  const screenId = getCurrentScreenId();
  if (!REFRESHABLE_MAIN_SCREENS.has(screenId)) return null;

  const screenEl = document.getElementById(screenId);
  if (!screenEl || getComputedStyle(screenEl).display === 'none') return null;

  if (screenId === 'screen-agenda') {
    const agendaScroll = getActiveAgendaScrollContainer();
    if (!agendaScroll) return null;
    return { screenId, scrollEl: agendaScroll, surfaceEl: screenEl };
  }

  return { screenId, scrollEl: screenEl, surfaceEl: screenEl };
}

function isModalSurfaceOpen() {
  const overlayIds = [
    'quick-add-sheet',
    'quick-add-backdrop',
    'agenda-item-actions',
    'agenda-actions-backdrop',
    'task-schedule-sheet',
    'task-schedule-backdrop',
    'task-create-sheet',
    'task-create-backdrop',
  ];

  return overlayIds.some((id) => {
    const el = document.getElementById(id);
    if (!el) return false;
    if (el.classList.contains('open')) return true;
    return getComputedStyle(el).display !== 'none';
  });
}

function isEligiblePullStart(event) {
  if (!event || !event.touches || event.touches.length !== 1) return false;
  if (isModalSurfaceOpen()) return false;
  const context = getRefreshInteractionContext();
  if (!context) return false;
  if (context.scrollEl.scrollTop > 0) return false;

  pullRefreshState.tracking = true;
  pullRefreshState.pulling = false;
  pullRefreshState.startY = event.touches[0].clientY;
  pullRefreshState.distance = 0;
  pullRefreshState.activeScreen = context.screenId;
  pullRefreshState.activeScrollEl = context.scrollEl;
  pullRefreshState.activeSurfaceEl = context.surfaceEl;
  return true;
}

function pullResistance(distance) {
  const raw = Math.max(0, distance);
  if (raw <= 0) return 0;
  const stretched = raw * 0.52;
  return Math.min(PULL_TO_REFRESH_CONFIG.maxPullDistance, stretched);
}

function updatePullIndicator(distance = 0, refreshing = false) {
  const indicator = document.getElementById('pull-refresh-indicator');
  if (!indicator) return;

  const visible = refreshing || distance > 0;
  indicator.classList.toggle('is-visible', visible);
  indicator.classList.toggle('is-refreshing', refreshing);

  if (!visible) {
    indicator.style.transform = 'translate(-50%, -120%)';
    return;
  }

  const y = refreshing ? 0 : Math.min(distance * 0.6, 52);
  indicator.style.transform = `translate(-50%, ${y}px)`;
}

function updatePullSurface(distance = 0) {
  const surface = pullRefreshState.activeSurfaceEl;
  if (!surface) return;
  surface.style.transform = distance > 0 ? `translateY(${distance}px)` : '';
  surface.style.transition = distance > 0 ? 'none' : 'transform 0.2s ease';
}

function resetPullGesture() {
  pullRefreshState.tracking = false;
  pullRefreshState.pulling = false;
  pullRefreshState.distance = 0;
  updatePullSurface(0);
  updatePullIndicator(0, Boolean(refreshInFlightPromise));

  pullRefreshState.activeScreen = null;
  pullRefreshState.activeScrollEl = null;
  pullRefreshState.activeSurfaceEl = null;
}

async function refreshOperationalData() {
  const batchData = await airtable(TABLES.batches, '?sort[0][field]=Date&sort[0][direction]=desc');
  const batchRecords = batchData.records || [];
  lastRefreshBatchRecords = batchRecords;

  cachedTaskBatchRecords = batchRecords;
  if (typeof hydrateTaskCreateBatchOptions === 'function') {
    hydrateTaskCreateBatchOptions();
  }
  if (typeof renderHomeBatches === 'function') {
    renderHomeBatches(batchRecords);
  }

  if (typeof loadTasks === 'function') await loadTasks();
  if (typeof loadAgendaFromAirtable === 'function') await loadAgendaFromAirtable();
  if (typeof loadFinancialFromAirtable === 'function') await loadFinancialFromAirtable();

  if (typeof renderWhatsNext === 'function') await renderWhatsNext();

  return {
    batches: batchRecords.length,
    agenda: Array.isArray(window._agendaCache) ? window._agendaCache.length : 0,
  };
}

async function refreshSemanticLayer() {
  if (!Array.isArray(APP_READINESS_CONDITIONS) || !APP_READINESS_CONDITIONS.length) {
    APP_READINESS_CONDITIONS = SEMANTIC.readinessConditionsFallback;
    return { source: 'fallback-semantics', conditions: APP_READINESS_CONDITIONS.length };
  }

  return { source: 'existing-semantics', conditions: APP_READINESS_CONDITIONS.length };
}

async function rerenderVisibleUI() {
  const currentScreenId = getCurrentScreenId();

  if (typeof renderAgendaPreview === 'function') renderAgendaPreview();
  if (typeof renderFinancialPreview === 'function') renderFinancialPreview();
  if (typeof applyHomeLabels === 'function') applyHomeLabels();

  if (currentScreenId === 'screen-home') {
    if (typeof renderWhatsNext === 'function') await renderWhatsNext();
    if (typeof renderHomeBatches === 'function' && Array.isArray(lastRefreshBatchRecords)) {
      renderHomeBatches(lastRefreshBatchRecords);
    }
  }

  if (currentScreenId === 'screen-batches') {
    const listEl = document.getElementById('batch-list');
    if (listEl) {
      if (!lastRefreshBatchRecords.length) {
        listEl.innerHTML = `<div class="empty">${t('batch.no_batches')}</div>`;
      } else if (typeof batchCard === 'function') {
        listEl.innerHTML = lastRefreshBatchRecords.map((record) => batchCard(record)).join('');
      }
    }
  }

  if (currentScreenId === 'screen-agenda') {
    const currentAgendaView = window.APP_STATE?.agendaView
      || (typeof agendaView !== 'undefined' ? agendaView : 'day');
    switch (currentAgendaView) {
      case 'week':
        if (typeof renderAgendaWeek === 'function') renderAgendaWeek();
        break;
      case 'month':
        if (typeof renderAgendaMonth === 'function') renderAgendaMonth();
        break;
      case 'day':
      default:
        if (typeof renderAgendaForSelectedDay === 'function') renderAgendaForSelectedDay();
        break;
    }
  }

  if (currentScreenId === 'screen-financial' && typeof renderFinancialPage === 'function') {
    renderFinancialPage();
  }
}

async function runRefreshPipeline({
  refreshOperational = true,
  refreshSemantics = true,
  rerender = true,
} = {}) {
  const result = {};

  if (refreshOperational) {
    result.operational = await refreshOperationalData();
  }

  if (refreshSemantics) {
    result.semantic = await refreshSemanticLayer();
  }

  if (rerender) {
    await rerenderVisibleUI();
    result.rerendered = true;
  }

  return result;
}

async function refreshApp(options = {}) {
  if (refreshInFlightPromise) return refreshInFlightPromise;

  const indicatorStartDistance = options.pullDistance || 0;
  updatePullIndicator(indicatorStartDistance, true);

  refreshInFlightPromise = (async () => {
    try {
      const result = await runRefreshPipeline(options);
      if (!options.silentSuccess) {
        toast('Updated');
      }
      return result;
    } finally {
      refreshInFlightPromise = null;
      updatePullSurface(0);
      setTimeout(() => updatePullIndicator(0, false), 120);
    }
  })();

  return refreshInFlightPromise;
}

function handlePullTouchStart(event) {
  isEligiblePullStart(event);
}

function handlePullTouchMove(event) {
  if (!pullRefreshState.tracking || refreshInFlightPromise) return;
  const activeScroll = pullRefreshState.activeScrollEl;
  if (!activeScroll) return;
  if (activeScroll.scrollTop > 0) {
    resetPullGesture();
    return;
  }

  const touch = event.touches?.[0];
  if (!touch) return;
  const deltaY = touch.clientY - pullRefreshState.startY;

  if (deltaY <= 0) {
    if (pullRefreshState.pulling) {
      event.preventDefault();
      pullRefreshState.distance = 0;
      updatePullSurface(0);
      updatePullIndicator(0, false);
    }
    return;
  }

  if (!pullRefreshState.pulling && deltaY < PULL_TO_REFRESH_CONFIG.activateDistance) return;

  pullRefreshState.pulling = true;
  event.preventDefault();

  const distance = pullResistance(deltaY);
  pullRefreshState.distance = distance;
  updatePullSurface(distance);
  updatePullIndicator(distance, false);
}

async function handlePullTouchEnd() {
  if (!pullRefreshState.tracking) return;

  const shouldTrigger = pullRefreshState.pulling
    && pullRefreshState.distance >= PULL_TO_REFRESH_CONFIG.triggerDistance;

  const pulledDistance = pullRefreshState.distance;
  resetPullGesture();

  if (shouldTrigger) {
    try {
      await refreshApp({ pullDistance: pulledDistance });
    } catch (error) {
      console.error('[Refresh] failed:', error);
      if (typeof toast === 'function') {
        toast('Refresh failed. Check connection.');
      }
    }
  }
}

function initPullToRefresh() {
  const appShell = document.querySelector('.app');
  if (!appShell) return;

  appShell.addEventListener('touchstart', handlePullTouchStart, { passive: true });
  appShell.addEventListener('touchmove', handlePullTouchMove, { passive: false });
  appShell.addEventListener('touchend', handlePullTouchEnd, { passive: true });
  appShell.addEventListener('touchcancel', handlePullTouchEnd, { passive: true });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initPullToRefresh);
} else {
  initPullToRefresh();
}
