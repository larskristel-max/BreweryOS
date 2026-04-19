const MAIN_TAB_SCREENS = new Set([
  'screen-home',
  'screen-batches',
  'screen-agenda',
  'screen-tasks',
  'screen-financial',
]);

function openMainTab(screenId) {
  if (screenId === 'screen-batches') {
    loadBatches();
    return;
  }
  showScreen(screenId);
}

function updateBottomNavState(screenId) {
  document.querySelectorAll('.bottom-nav .nav-item').forEach((item) => {
    const isActive = item.dataset.screen === screenId;
    item.classList.toggle('active', isActive);
    item.setAttribute('aria-current', isActive ? 'page' : 'false');
  });
}

function isMainTabScreen(screenId) {
  return MAIN_TAB_SCREENS.has(screenId);
}
