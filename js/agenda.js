function setAgendaSelectedDate(value = new Date()) {
  let dateObj = null;
  if (typeof value === 'string') dateObj = parseLocalDateKey(value);
  else dateObj = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  if (!(dateObj instanceof Date) || Number.isNaN(dateObj.getTime())) return;
  const normalized = startOfLocalDay(dateObj);
  selectedAgendaDateKey = localDateKey(normalized);
  window._agendaSelectedDate = selectedAgendaDateKey;
  agendaDate = normalized;
}

function formatAgendaDate(d) {
  return d.toLocaleDateString('en-GB', { weekday:'short', day:'numeric', month:'short' });
}

function getUndatedAgendaItems(items = []) {
  return (items || []).filter(item => !item.scheduledTime);
}

function agendaMinutesFromScheduled(item = {}) {
  if (!item || !item.scheduledTime) return null;
  const dt = scheduledItemToDate(item.scheduledTime);
  if (!dt) return null;
  return dt.getHours() * 60 + dt.getMinutes();
}

function getAgendaItemsForDate(dateKey) {
  const cache = Array.isArray(window._agendaCache) ? window._agendaCache : [];
  return cache.filter(item => {
    if (!item.scheduledTime) return false;
    const scheduled = scheduledItemToDate(item.scheduledTime);
    if (!scheduled) return false;
    return localDateKey(scheduled) === dateKey;
  });
}

function getMonthGridDates(baseDate = getLocalTodayDate()) {
  const monthStart = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
  const monthEnd = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0);
  const leading = (monthStart.getDay() + 6) % 7;
  const totalCells = Math.ceil((leading + monthEnd.getDate()) / 7) * 7;
  const gridStart = addDaysLocal(monthStart, -leading);
  return Array.from({ length: totalCells }, (_, idx) => addDaysLocal(gridStart, idx));
}
