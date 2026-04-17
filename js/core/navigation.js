function showScreen(id) {
  const previousScreen = screenStack[screenStack.length - 1];
  if (previousScreen === 'screen-home' && previousScreen !== id) {
    const homeScreen = document.getElementById('screen-home');
    homeScrollY = Math.max(window.scrollY || 0, homeScreen?.scrollTop || 0, homeScrollY || 0);
  }
  document.querySelectorAll('[id^="screen-"]').forEach(s => {
    s.style.display = 'none';
  });
  const target = document.getElementById(id);
  if (!target) return;

  if (!isHistoryNavigation) {
    const current = screenStack[screenStack.length - 1];
    if (current !== id) {
      screenStack.push(id);
    }
  }

  target.style.display = 'flex';

  const navBack = document.getElementById('navBack');
  if (navBack) {
    navBack.style.display = screenStack.length > 1 ? 'flex' : 'none';
  }
  const shouldRestoreHomeScroll = id === 'screen-home' && previousScreen === 'screen-batch-detail' && homeScrollY > 0;
  if (shouldRestoreHomeScroll) {
    requestAnimationFrame(() => {
      window.scrollTo(0, homeScrollY);
      target.scrollTop = homeScrollY;
    });
  } else {
    window.scrollTo(0, 0);
    target.scrollTop = 0;
  }
  // Also reset inner scroll containers for screens that manage their own scroll
  const innerScrollIds = {
    'screen-agenda':    ['agenda-list', 'agenda-week-view'],
    'screen-financial': [],  // scrolls as element itself
  };
  if (innerScrollIds[id]) {
    innerScrollIds[id].forEach(cid => {
      const c = document.getElementById(cid);
      if (c) c.scrollTop = 0;
    });
  }
  if (id === 'screen-financial') target.scrollTop = 0;
  // refresh screen-specific state on navigate
  if (id === 'screen-agenda') {
    const maybeSelected = parseLocalDateKey(selectedAgendaDateKey);
    if (!maybeSelected) setAgendaSelectedDate(getLocalTodayDate());
    switchAgendaView(agendaView);
    loadAgendaFromAirtable();
  }
  if (id === 'screen-tasks') { loadTasks(); }
  if (id === 'screen-financial') { renderFinancialPage(); loadFinancialFromAirtable(); }
  if (id === 'screen-settings') { initSettings(); populateSettingsLanguageValue(); }
  if (id === 'screen-home') {
    renderWhatsNext();
    renderAgendaPreview();
    renderFinancialPreview();
    applyHomeLabels();
  }
}
