// ── AGENDA ───────────────────────────────────────────────────────────────────
let agendaView = localStorage.getItem('brewos_agenda_view') || 'day';
let agendaDate = getLocalTodayDate();
let selectedAgendaDateKey = localDateKey(agendaDate);

const AGENDA_ITEMS_DEMO = [
  { id: 1, time: '08:00', title: 'Check mash temperature — Batch 4', system: true,  done: false, type: 'task'  },
  { id: 2, time: '11:00', title: 'Transfer to fermenter',             system: false, done: false, type: 'task'  },
  { id: 3, time: '14:00', title: 'Excise declaration due Apr 20',    system: true,  done: false, type: 'event' },
  { id: 4, time: null,    title: 'Call Brasserie Dupont — hop order', system: false, done: false, type: 'note'  },
  { id: 5, time: null,    title: 'Review Q1 cost summary',            system: false, done: false, type: 'note'  },
];

let agendaItems = [...AGENDA_ITEMS_DEMO];
let quickAddType = 'task';
let agendaMonthBaseDate = parseLocalDateKey(selectedAgendaDateKey) || getLocalTodayDate();
let agendaActionItemId = '';
let taskScheduleTaskId = '';
let taskScheduleOpenedAt = 0;

function getAgendaPreviewFallbackItems() {
  return AGENDA_ITEMS_DEMO.slice(0, 3).map((item) => ({
    time: item.time || null,
    title: item.title || '—',
    system: Boolean(item.system),
  }));
}

function switchAgendaView(view) {
  if (!selectedAgendaDateKey || !parseLocalDateKey(selectedAgendaDateKey)) {
    setAgendaSelectedDate(getLocalTodayDate());
  }
  agendaView = view;
  localStorage.setItem('brewos_agenda_view', view);
  const dayTab = document.getElementById('agenda-tab-day');
  const weekTab = document.getElementById('agenda-tab-week');
  const monthTab = document.getElementById('agenda-tab-month');
  const dayList = document.getElementById('agenda-list');
  const weekGrid = document.getElementById('agenda-week-view');
  const monthView = document.getElementById('agenda-month-view');
  if (dayTab) dayTab.classList.toggle('active', view === 'day');
  if (weekTab) weekTab.classList.toggle('active', view === 'week');
  if (monthTab) monthTab.classList.toggle('active', view === 'month');

  if (view === 'day') {
    if (dayList)  dayList.style.display = 'block';
    if (weekGrid) weekGrid.style.display = 'none';
    if (monthView) monthView.style.display = 'none';
    if (window._agendaCache) {
      renderAgendaForSelectedDay();
    } else {
      loadAgendaFromAirtable();
    }
  } else if (view === 'week') {
    if (dayList)  dayList.style.display = 'none';
    if (weekGrid) weekGrid.style.display = 'block';
    if (monthView) monthView.style.display = 'none';
    renderAgendaWeek();
  } else {
    if (dayList) dayList.style.display = 'none';
    if (weekGrid) weekGrid.style.display = 'none';
    if (monthView) monthView.style.display = 'block';
    agendaMonthBaseDate = parseLocalDateKey(selectedAgendaDateKey) || getLocalTodayDate();
    renderAgendaMonth();
  }
}

function goAgendaToday() {
  setAgendaSelectedDate(getLocalTodayDate());
  agendaMonthBaseDate = parseLocalDateKey(selectedAgendaDateKey) || getLocalTodayDate();
  renderAgendaWeek();
  renderAgendaMonth();
  if (window._agendaCache) {
    renderAgendaForSelectedDay();
  } else {
    loadAgendaFromAirtable();
  }
}

function renderAgendaDay() {
  const selectedDateObj = parseLocalDateKey(selectedAgendaDateKey) || getLocalTodayDate();
  agendaDate = selectedDateObj;
  const header = document.getElementById('agenda-date-label');
  if (header) header.textContent = formatAgendaDate(selectedDateObj);
  const todayPill = document.getElementById('agenda-today-pill');
  const isToday = isSameLocalDay(selectedDateObj, getLocalTodayDate());
  if (todayPill) todayPill.style.display = isToday ? 'none' : 'inline-block';

  const timed = agendaItems.filter(i => i.time).sort((a,b) => a.time.localeCompare(b.time));
  const untimed = agendaItems.filter(i => !i.time);
  const now = new Date();
  const nowStr = now.getHours().toString().padStart(2,'0') + ':' + now.getMinutes().toString().padStart(2,'0');

  let html = '';
  let injectedNow = false;

  timed.forEach(item => {
    if (!injectedNow && isToday && item.time > nowStr) {
      html += `<div style="display:flex; align-items:center; gap:8px; margin:6px 0;">
        <div style="flex:1; height:2px; background:#ef4444;"></div>
        <span style="font-size:10px; color:#ef4444; font-weight:600;">${nowStr}</span>
      </div>`;
      injectedNow = true;
    }
    html += renderAgendaItem(item);
  });

  if (!injectedNow && isToday) {
    html += `<div style="display:flex; align-items:center; gap:8px; margin:6px 0;">
      <div style="flex:1; height:2px; background:#ef4444;"></div>
      <span style="font-size:10px; color:#ef4444; font-weight:600;">${nowStr}</span>
    </div>`;
  }

  if (untimed.length) {
    html += `<p class="section-label" style="margin:16px 0 8px;">${t('agenda.untimed')}</p>`;
    untimed.forEach(item => { html += renderAgendaItem(item); });
  }

  const list = document.getElementById('agenda-list');
  if (list) list.innerHTML = html;
}

function renderAgendaItem(item) {
  const fade = item.done ? 'opacity:0.45;' : '';
  const done = item.done ? 'text-decoration:line-through; color:#9ca3af;' : 'color:#111827;';
  const systemIcon = item.system ? '<span class="text-meta" title="Système">✦</span>' : '<span style="min-width:14px; display:inline-block;"></span>';
  return `<div onclick="toggleAgendaDone(${item.id})"
    style="background:#fff; border:1.5px solid #f3f4f6; border-radius:12px; padding:12px 14px; display:flex; align-items:center; gap:12px; margin-bottom:8px; cursor:pointer; ${fade}">
    <span class="text-meta" style="min-width:36px;">${item.time || ''}</span>
    ${systemIcon}
    <p class="text-card-title" style="flex:1; ${done}">${item.title}</p>
  </div>`;
}

function toggleAgendaDone(id) {
  agendaItems = agendaItems.map(i => i.id === id ? {...i, done: !i.done} : i);
  renderAgendaDay();
}

function renderAgendaWeek() {
  const days = ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'];
  const grid = document.getElementById('agenda-week-grid');
  if (!grid) return;
  const selectedDate = parseLocalDateKey(selectedAgendaDateKey) || getLocalTodayDate();
  const weekStart = startOfLocalWeek(selectedDate);
  const today = getLocalTodayDate();
  grid.innerHTML = days.map((d, i) => {
    const date = addDaysLocal(weekStart, i);
    const dateKey = localDateKey(date);
    const isSelected = dateKey === selectedAgendaDateKey;
    const isToday = isSameLocalDay(date, today);
    const bg = isSelected ? '#111827' : '#f9fafb';
    const fg = isSelected ? '#fff' : '#6b7280';
    const ring = !isSelected && isToday ? 'border:1px solid #9ca3af;' : '';
    return `<div onclick="selectAgendaWeekDay('${dateKey}')"
      style="padding:8px 4px; border-radius:10px; cursor:pointer; background:${bg}; color:${fg}; ${ring}">
      <p style="font-size:11px; margin:0 0 4px;">${d}</p>
      <p style="font-size:16px; font-weight:600; margin:0;">${date.getDate()}</p>
    </div>`;
  }).join('');

  const cache = window._agendaCache;
  const undated = Array.isArray(cache)
    ? getUndatedAgendaItems(cache).sort((a, b) => a.positionIndex - b.positionIndex)
    : [];
  const weekView = document.getElementById('agenda-week-view');
  if (!weekView) return;
  const existingUndated = document.getElementById('agenda-week-undated');
  if (existingUndated) existingUndated.remove();
  const section = document.createElement('div');
  section.id = 'agenda-week-undated';
  section.style.marginTop = '16px';
  section.innerHTML = `
    <p style="font-size:12px;font-weight:600;color:#6b7280;margin:0 0 6px;">Sans date</p>
    ${undated.length > 0 ? renderAgendaItemsListHtml(undated) : `<div style="color:#9e9e9e;font-size:13px;padding:4px 0;">Aucun élément sans date.</div>`}
  `;
  weekView.appendChild(section);
}

function renderAgendaMonth() {
  const monthRoot = document.getElementById('agenda-month-grid');
  if (!monthRoot) return;
  const selectedDate = parseLocalDateKey(selectedAgendaDateKey) || getLocalTodayDate();
  if (!agendaMonthBaseDate) agendaMonthBaseDate = selectedDate;
  const todayKey = localDateKey(getLocalTodayDate());
  const selectedKey = localDateKey(selectedDate);
  const monthLabel = agendaMonthBaseDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  const gridDates = getMonthGridDates(agendaMonthBaseDate);
  const baseMonth = agendaMonthBaseDate.getMonth();
  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  let html = `<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
    <button onclick="shiftAgendaMonth(-1)" style="border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:8px 10px;font-size:14px;color:#374151;">‹</button>
    <p style="margin:0;font-size:15px;font-weight:600;color:#111827;">${monthLabel}</p>
    <button onclick="shiftAgendaMonth(1)" style="border:1px solid #e5e7eb;background:#fff;border-radius:10px;padding:8px 10px;font-size:14px;color:#374151;">›</button>
  </div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;text-align:center;margin-bottom:4px;">${dayNames.map(d => `<div style="font-size:11px;color:#9ca3af;padding:4px 0;">${d}</div>`).join('')}</div>`;
  html += `<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px;">`;
  gridDates.forEach((dateObj) => {
    const dateKey = localDateKey(dateObj);
    const inMonth = dateObj.getMonth() === baseMonth;
    const isToday = dateKey === todayKey;
    const isSelected = dateKey === selectedKey;
    const items = getAgendaItemsForDate(dateKey);
    const dots = Math.min(items.length, 3);
    const dotColor = isSelected ? '#fff' : '#111827';
    html += `<button onclick="selectAgendaMonthDay('${dateKey}')" style="min-height:56px;border:1px solid ${isSelected ? '#111827' : '#e5e7eb'};border-radius:10px;background:${isSelected ? '#111827' : '#fff'};color:${isSelected ? '#fff' : (inMonth ? '#111827' : '#9ca3af')};padding:6px 4px;display:flex;flex-direction:column;align-items:center;justify-content:flex-start;gap:4px;">
      <span style="font-size:13px;font-weight:${isToday || isSelected ? '700' : '500'};${isToday && !isSelected ? 'text-decoration:underline;' : ''}">${dateObj.getDate()}</span>
      <span style="display:flex;gap:3px;min-height:8px;align-items:center;">${Array.from({length:dots}, () => `<span style="width:5px;height:5px;border-radius:50%;background:${dotColor};opacity:${isSelected ? '0.95' : '0.65'};"></span>`).join('')}${items.length > 3 ? `<span style="font-size:10px;color:${isSelected ? '#fff' : '#6b7280'};">${items.length}</span>` : ''}</span>
    </button>`;
  });
  html += `</div>`;
  const undated = getUndatedAgendaItems(Array.isArray(window._agendaCache) ? window._agendaCache : []).sort((a, b) => a.positionIndex - b.positionIndex);
  html += `<div style="margin-top:14px;"><p style="font-size:12px;font-weight:600;color:#6b7280;margin:0 0 6px;">Sans date</p>${undated.length ? renderAgendaItemsListHtml(undated) : `<div style="color:#9e9e9e;font-size:13px;padding:4px 0;">Aucun élément sans date.</div>`}</div>`;
  monthRoot.innerHTML = html;
}

function shiftAgendaMonth(delta = 0) {
  const base = agendaMonthBaseDate || parseLocalDateKey(selectedAgendaDateKey) || getLocalTodayDate();
  agendaMonthBaseDate = new Date(base.getFullYear(), base.getMonth() + delta, 1);
  renderAgendaMonth();
}

function selectAgendaMonthDay(dateKey) {
  const selected = parseLocalDateKey(dateKey);
  if (!selected) return;
  setAgendaSelectedDate(selected);
  agendaMonthBaseDate = new Date(selected.getFullYear(), selected.getMonth(), 1);
  switchAgendaView('day');
}

function openAgendaItemActions(itemId = '') {
  const item = Array.isArray(window._agendaCache) ? window._agendaCache.find(entry => entry.id === itemId) : null;
  if (!item) return;
  agendaActionItemId = itemId;
  const toggleBtn = document.getElementById('agenda-action-toggle-done');
  if (toggleBtn) toggleBtn.textContent = item.isCompleted ? 'Rouvrir' : 'Marquer terminé';
  const panel = document.getElementById('agenda-item-actions');
  const backdrop = document.getElementById('agenda-actions-backdrop');
  if (backdrop) backdrop.style.display = 'block';
  if (panel) panel.style.display = 'block';
}

function closeAgendaItemActions() {
  const panel = document.getElementById('agenda-item-actions');
  const backdrop = document.getElementById('agenda-actions-backdrop');
  if (backdrop) backdrop.style.display = 'none';
  if (panel) panel.style.display = 'none';
  hideAgendaSetDateInline();
  agendaActionItemId = '';
}


async function agendaActionToggleDone() {
  const item = Array.isArray(window._agendaCache) ? window._agendaCache.find(entry => entry.id === agendaActionItemId) : null;
  if (!item) return;
  const linkedTaskId = deriveAgendaLinkedTaskId(item);
  if (isAgendaCompletable(item, linkedTaskId)) {
    await toggleAgendaTaskCompletion(null, item.id, linkedTaskId);
  } else {
    await toggleAgendaItemById(item.id);
  }
  closeAgendaItemActions();
}

function agendaActionSetDate() {
  const item = Array.isArray(window._agendaCache)
    ? window._agendaCache.find(entry => entry.id === agendaActionItemId)
    : null;
  const inline = document.getElementById('agenda-set-date-inline');
  const dateInput = document.getElementById('agenda-set-date-input');
  const timeInput = document.getElementById('agenda-set-time-input');
  if (!item || !inline || !dateInput || !timeInput || !agendaActionItemId) return;
  const currentScheduled = item.scheduledTime ? scheduledItemToDate(item.scheduledTime) : null;
  const currentKey = currentScheduled ? localDateKey(currentScheduled) : '';
  dateInput.value = parseLocalDateKey(currentKey) ? currentKey : selectedAgendaDateKey;
  if (item.scheduledTime && !isUntimedDateItem(item)) {
    const dt = scheduledItemToDate(item.scheduledTime);
    if (!dt) {
      timeInput.value = '';
      inline.style.display = 'block';
      return;
    }
    timeInput.value = String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0');
  } else {
    timeInput.value = '';
  }
  inline.style.display = 'block';
}

function hideAgendaSetDateInline() {
  const inline = document.getElementById('agenda-set-date-inline');
  if (inline) inline.style.display = 'none';
}

function cancelAgendaSetDateInline() {
  hideAgendaSetDateInline();
}

async function confirmAgendaSetDateTime() {
  const dateInput = document.getElementById('agenda-set-date-input');
  const timeInput = document.getElementById('agenda-set-time-input');
  const nextKey = String(dateInput?.value || '').trim();
  const timeValue = String(timeInput?.value || '').trim();
  if (!agendaActionItemId) return;
  const item = Array.isArray(window._agendaCache) ? window._agendaCache.find(e => e.id === agendaActionItemId) : null;
  if (!item) return;
  if (nextKey && !parseLocalDateKey(nextKey)) return;
  const nextScheduled = (nextKey && timeValue) ? buildScheduledTimeFromInputs(nextKey, timeValue) : null;
  await airtablePatch(TABLES.tasks, agendaActionItemId, {
    'Due Date': nextKey || null,
    'Scheduled Time': nextScheduled || null
  });
  item.scheduledTime = nextScheduled || (nextKey ? normalizeAgendaScheduleValue(nextKey, true) : null);
  item.hasExplicitScheduledTime = Boolean(nextScheduled);
  if (nextKey && parseLocalDateKey(nextKey)) setAgendaSelectedDate(nextKey);
  renderAgendaForSelectedDay();
  renderAgendaWeek();
  renderAgendaMonth();
  hideAgendaSetDateInline();
  closeAgendaItemActions();
}

function buildScheduledTimeFromInputs(dateKey, timeValue) {
  const localDate = parseLocalDateKey(dateKey);
  if (!localDate) return null;
  const trimmed = String(timeValue || '').trim();
  if (!trimmed) return null;
  const parts = trimmed.split(':');
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1] || '0', 10);
  if (Number.isNaN(hours) || Number.isNaN(minutes)) return null;
  return new Date(localDate.getFullYear(), localDate.getMonth(), localDate.getDate(), hours, minutes, 0, 0).toISOString();
}

function isMidnightScheduledValue(value) {
  const dt = scheduledItemToDate(value);
  if (!dt) return false;
  return dt.getHours() === 0 && dt.getMinutes() === 0 && dt.getSeconds() === 0;
}

function isLegacyMidnightSentinelScheduledValue(scheduledValue, dueValue) {
  if (!isMidnightScheduledValue(scheduledValue)) return false;
  const dueNormalized = normalizeAgendaScheduleValue(dueValue, true);
  if (!dueNormalized) return true;
  const scheduledDate = scheduledItemToDate(scheduledValue);
  const dueDate = scheduledItemToDate(dueNormalized);
  if (!scheduledDate || !dueDate) return true;
  return !isSameLocalDay(scheduledDate, dueDate);
}

function isUntimedDateItem(item) {
  if (!item || !item.scheduledTime) return false;
  const raw = String(item.scheduledTime || '').trim();
  if (item.hasExplicitScheduledTime) return false;
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return true;
  const dt = scheduledItemToDate(raw);
  if (!dt) return false;
  return dt.getHours() === 0 && dt.getMinutes() === 0 && dt.getSeconds() === 0;
}

async function toggleAgendaItemById(id) {
  const item = Array.isArray(window._agendaCache) ? window._agendaCache.find(i => i.id === id) : null;
  if (!item) return;
  const nextDone = !item.isCompleted;
  item.isCompleted = nextDone;
  try {
    await patchTaskStatusWithFallback(id, nextDone);
    renderAgendaForSelectedDay();
  } catch (err) {
    item.isCompleted = !nextDone;
    console.warn('[Agenda] patch failed', err);
    toast('Could not update agenda item');
  }
}

function combineDateWithExistingTime(dateKey, scheduledTime) {
  const localDate = parseLocalDateKey(dateKey);
  if (!localDate) return null;
  if (!scheduledTime) {
    const localMidday = new Date(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      12, 0, 0, 0
    );
    return localMidday.toISOString();
  }
  const existing = new Date(scheduledTime);
  if (Number.isNaN(existing.getTime())) {
    const localMidday = new Date(
      localDate.getFullYear(),
      localDate.getMonth(),
      localDate.getDate(),
      12, 0, 0, 0
    );
    return localMidday.toISOString();
  }
  const merged = new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    existing.getHours(),
    existing.getMinutes(),
    existing.getSeconds(),
    existing.getMilliseconds()
  );
  return merged.toISOString();
}

async function setAgendaItemDate(itemId, dateKey) {
  const item = Array.isArray(window._agendaCache) ? window._agendaCache.find(entry => entry.id === itemId) : null;
  if (!item) return;
  const nextScheduled = combineDateWithExistingTime(dateKey, item.scheduledTime);
  if (!nextScheduled) return;
  await airtablePatch(TABLES.tasks, itemId, { 'Due Date': dateKey, 'Scheduled Time': nextScheduled });
  item.scheduledTime = nextScheduled;
  item.hasExplicitScheduledTime = true;
  setAgendaSelectedDate(dateKey);
  renderAgendaForSelectedDay();
  renderAgendaWeek();
  renderAgendaMonth();
}

async function removeAgendaItemDate(itemId) {
  const item = Array.isArray(window._agendaCache) ? window._agendaCache.find(entry => entry.id === itemId) : null;
  if (!item) return;
  await airtablePatch(TABLES.tasks, itemId, { 'Due Date': null, 'Scheduled Time': null });
  item.scheduledTime = null;
  item.hasExplicitScheduledTime = false;
  renderAgendaForSelectedDay();
  renderAgendaWeek();
  renderAgendaMonth();
}

function selectAgendaWeekDay(dateKey) {
  const selected = parseLocalDateKey(dateKey);
  if (!selected) return;
  setAgendaSelectedDate(selected);
  switchAgendaView('day');
}

function openQuickAdd() {
  const sheet = document.getElementById('quick-add-sheet');
  if (sheet) sheet.style.display = 'flex';
  document.body.classList.add('quick-add-open');
  const timeInput = document.getElementById('quick-add-time');
  if (timeInput && !timeInput.value) {
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    timeInput.value = `${hh}:${mm}`;
  }
  setQuickType('task');
  // backdrop
  let bd = document.getElementById('quick-add-backdrop');
  if (!bd) {
    bd = document.createElement('div');
    bd.id = 'quick-add-backdrop';
    bd.style.cssText = 'position:fixed;inset:0;background:rgba(0,0,0,0.2);z-index:4100;';
    bd.onclick = closeQuickAdd;
    document.body.appendChild(bd);
  }
  bd.style.display = 'block';
}

function closeQuickAdd() {
  const sheet = document.getElementById('quick-add-sheet');
  if (sheet) sheet.style.display = 'none';
  document.body.classList.remove('quick-add-open');
  const bd = document.getElementById('quick-add-backdrop');
  if (bd) bd.style.display = 'none';
  const input = document.getElementById('quick-add-input');
  const time = document.getElementById('quick-add-time');
  if (input) input.value = '';
  if (time) time.value = '';
}

function setQuickType(type) {
  quickAddType = type;
  ['task','note','event'].forEach(t => {
    const btn = document.getElementById('qtype-' + t);
    if (!btn) return;
    if (t === type) {
      btn.style.background = '#111827';
      btn.style.color = '#fff';
      btn.style.borderColor = '#111827';
    } else {
      btn.style.background = '#fff';
      btn.style.color = '#6b7280';
      btn.style.borderColor = '#e5e7eb';
    }
  });
}

async function saveQuickAdd() {
  const input = document.getElementById('quick-add-input');
  const timeEl = document.getElementById('quick-add-time');
  const title = input ? input.value.trim() : '';
  if (!title) return;
  const timeValue = timeEl && timeEl.value ? timeEl.value.trim() : '';
  const selectedDateKey = parseLocalDateKey(selectedAgendaDateKey)
    ? selectedAgendaDateKey
    : localDateKey(getLocalTodayDate());

  if (quickAddType === 'task') {
    const scheduledTime = (selectedDateKey && timeValue) ? buildScheduledTimeFromInputs(selectedDateKey, timeValue) : null;
    const createPayload = {
      'Task': title,
      'Status': 'To Do',
      'Source': 'Manual',
      ...(selectedDateKey ? { 'Due Date': selectedDateKey } : {}),
      ...(scheduledTime ? { 'Scheduled Time': scheduledTime } : {})
    };
    try {
      await createTaskRecordWithFallback(createPayload);
      closeQuickAdd();
      await loadTasks();
      await loadAgendaFromAirtable();
      renderAgendaWeek();
      renderAgendaMonth();
      renderAgendaPreview();
      toast('Task created');
    } catch (error) {
      console.error('AGENDA QUICK ADD TASK CREATE FAILED', error);
      toast('Could not create task');
    }
    return;
  }

  const newItem = {
    id: Date.now(),
    title,
    time: timeValue || null,
    type: quickAddType,
    system: false,
    done: false,
  };
  agendaItems = [...agendaItems, newItem];
  closeQuickAdd();
  renderAgendaForSelectedDay();
  renderAgendaPreview();
}

async function fetchAgendaItems() {
  const formula = encodeURIComponent(activeTaskFilterFormula());
  const query = `?filterByFormula=${formula}&maxRecords=200&sort[0][field]=Scheduled Time&sort[0][direction]=asc`;
  const data = await airtable(TABLES.tasks, query);
  if (data.error) throw new Error(`Airtable tasks ${data.error.type || 'error'}`);

  return (data.records || []).map((rec, idx) => {
    const f = rec.fields || rec.cellValuesByFieldId || {};
    const getF = (name) => f[name] ?? undefined;
    const linkedBatchId = deriveTaskBatchId(f);
    const linkedBrewLogId = deriveTaskBrewLogId(f);
    const scheduledRaw = getF('Scheduled Time');
    const dueRaw = getF('Due Date');
    const scheduledNormalized = normalizeAgendaScheduleValue(scheduledRaw, false);
    const dueFallbackNormalized = normalizeAgendaScheduleValue(dueRaw, true);
    const hasLegacyMidnightSentinel = scheduledNormalized
      ? isLegacyMidnightSentinelScheduledValue(scheduledNormalized, dueRaw)
      : false;
    return {
      id: rec.id,
      title: getF('Task') || '—',
      type: 'task',
      scheduledTime: scheduledNormalized || dueFallbackNormalized || null,
      hasExplicitScheduledTime: Boolean(scheduledNormalized) && !hasLegacyMidnightSentinel,
      isCompleted: normalizeTaskStatus(getF('Status')) === 'done',
      isSystem: String(sel(getF('Source')) || '').toLowerCase() === 'system',
      entityType: linkedBatchId ? 'Batch' : (linkedBrewLogId ? 'Brew Log' : ''),
      entityId: linkedBatchId || linkedBrewLogId || '',
      positionIndex: idx,
    };
  });
}

async function loadAgendaFromAirtable() {
  try {
    window._agendaCache = await fetchAgendaItems();
  } catch (err) {
    console.error('[Agenda] fetch failed', err);
    window._agendaCache = null;
  }
  renderAgendaForSelectedDay();
}

function renderAgendaForSelectedDay() {
  const cache = dedupeAgendaItemsById(window._agendaCache);
  if (!cache) return;

  if (!selectedAgendaDateKey || !parseLocalDateKey(selectedAgendaDateKey)) {
    setAgendaSelectedDate(getLocalTodayDate());
  }
  const selectedDate = selectedAgendaDateKey;
  const selectedDateObj = parseLocalDateKey(selectedDate) || getLocalTodayDate();

  const dayItems = cache.filter(item => {
    if (!item.scheduledTime) return false;
    const scheduled = scheduledItemToDate(item.scheduledTime);
    if (!scheduled) return false;
    return localDateKey(scheduled) === selectedDate;
  });

  const timedDayItems = dayItems
    .filter(i => !isUntimedDateItem(i))
    .sort((a, b) => a.scheduledTime.localeCompare(b.scheduledTime));

  const untimedDayItems = dayItems
    .filter(isUntimedDateItem)
    .sort((a, b) => (a.positionIndex || 0) - (b.positionIndex || 0));

  const undated = getUndatedAgendaItems(cache)
    .sort((a, b) => a.positionIndex - b.positionIndex);

  const header = document.getElementById('agenda-date-label');
  if (header && selectedDateObj) header.textContent = formatAgendaDate(selectedDateObj);
  const todayPill = document.getElementById('agenda-today-pill');
  const todayKey = localDateKey(getLocalTodayDate());
  if (todayPill) todayPill.style.display = selectedDate === todayKey ? 'none' : 'inline-block';

  const listEl = document.getElementById('agenda-day-list')
    || document.getElementById('agenda-list')
    || document.querySelector('.agenda-items-list')
    || document.querySelector('.agenda-day-items');

  if (!listEl) return;

  let html = '';
  html += buildTimelineBlocks(timedDayItems, selectedDateObj);
  if (timedDayItems.length === 0) {
    html += `<div class="text-empty" style="padding:8px 0 2px;">Aucun élément horaire pour cette journée.</div>`;
  }
  if (untimedDayItems.length > 0) {
    html += `<div style="padding-top:${timedDayItems.length > 0 ? '14px' : '4px'};">
      <p class="text-section">${t('agenda.untimed')}</p>
    </div>`;
    html += renderAgendaItemsListHtml(untimedDayItems);
  }
  html += `
    <div style="padding-top:${(timedDayItems.length > 0 || untimedDayItems.length > 0) ? '14px' : '8px'};">
      <p class="text-section">Sans date</p>
    </div>`;
  html += undated.length > 0
    ? renderAgendaItemsListHtml(undated)
    : `<div class="text-empty" style="padding:2px 0 6px;">Aucun élément sans date.</div>`;
  if (timedDayItems.length === 0 && untimedDayItems.length === 0 && undated.length === 0) {
    html += `<div class="text-empty" style="padding:8px 0;">${t('agenda.none_scheduled')}</div>`;
  }

  listEl.innerHTML = html;
  renderAgendaWeek();
  renderAgendaMonth();
}

function renderAgendaItemsListHtml(items = []) {
  const typeIcon  = { task: '☑', note: '✎', event: '◆' };
  const typeColor = { task: '#1565c0', note: '#6a1b9a', event: '#2e7d32' };

  return items.map(item => {
    const linkedTaskId = deriveAgendaLinkedTaskId(item);
    const isCompletable = isAgendaCompletable(item, linkedTaskId);
    const completionLabel = item.isCompleted ? 'Reopen' : 'Done';
    const scheduledDate = scheduledItemToDate(item.scheduledTime);
    const timeLabel = (item.scheduledTime && !isUntimedDateItem(item) && scheduledDate)
      ? scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';
    const systemMark = item.isSystem ? ' <span class="text-meta" style="color:#f57f17;">✦</span>' : '';
    const doneStyle  = item.isCompleted ? 'opacity:0.45;text-decoration:line-through;' : '';
    const icon       = typeIcon[item.type] || '☑';
    const color      = typeColor[item.type] || '#1565c0';

    return `
      <div class="agenda-item" data-id="${item.id}" data-completed="${item.isCompleted}"
        style="display:flex;align-items:flex-start;gap:12px;padding:12px 0;border-bottom:1px solid #f0f0f0;cursor:pointer;"
        onclick="openAgendaItemActions('${item.id}')">
        <div class="text-meta" style="min-width:44px;text-align:right;padding-top:2px;">
          ${timeLabel}
        </div>
        <div style="flex:1;${doneStyle}">
          <div class="text-card-title">
            <span class="text-meta" style="color:${color};margin-right:4px;">${icon}</span>
            ${item.title}${systemMark}
          </div>
          ${item.entityType ? `<div class="text-meta" style="margin-top:2px;">${item.entityType} ${item.entityId}</div>` : ''}
        </div>
        ${isCompletable ? `<button class="btn btn-secondary" style="width:auto;min-height:auto;padding:6px 10px;margin:0;" onclick="toggleAgendaTaskCompletion(event,'${item.id}','${linkedTaskId}')">${completionLabel}</button>` : ''}
      </div>`;
  }).join('');
}

function deriveAgendaLinkedTaskId(item = {}) {
  return String(item?.id || '').startsWith('rec') ? String(item.id) : '';
}

function isAgendaCompletable(item = {}, linkedTaskId = '') {
  return !!linkedTaskId;
}

async function toggleAgendaTaskCompletion(event, agendaItemId, linkedTaskId = '') {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const item = Array.isArray(window._agendaCache)
    ? window._agendaCache.find((entry) => entry.id === agendaItemId)
    : null;
  if (!item) return;
  if (!linkedTaskId) {
    toast('This agenda item is not linked to a task record');
    return;
  }
  const nextDone = !item.isCompleted;
  try {
    await toggleTaskStatusEverywhere(linkedTaskId, nextDone);
    item.isCompleted = nextDone;
    renderAgendaForSelectedDay();
  } catch (error) {
    console.warn('[Agenda] completion failed', error);
    toast('Could not update agenda item');
  }
}

function toggleAgendaItem(el, id) {
  const isDone = el.dataset.completed === 'true';
  el.dataset.completed = (!isDone).toString();
  const textEl = el.querySelector('[style*="font-weight"]');
  if (textEl) {
    textEl.parentElement.style.opacity        = isDone ? '1'           : '0.45';
    textEl.parentElement.style.textDecoration = isDone ? 'none'        : 'line-through';
  }
  if (window._agendaCache) {
    const item = window._agendaCache.find(i => i.id === id);
    if (item) item.isCompleted = !isDone;
  }
  patchTaskStatusWithFallback(id, !isDone)
    .catch(err => console.warn('[Agenda] patch failed', err));
}

function buildNowLine(dateObj = getLocalTodayDate(), timedItems = []) {
  const todayKey = localDateKey(getLocalTodayDate());
  if (localDateKey(dateObj) !== todayKey) return '';
  const now = new Date();
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const nowLabel = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const calmPadding = timedItems.length === 0 ? '12px 0 10px' : '6px 0';
  return `<div data-now-minutes="${nowMinutes}" style="display:flex;align-items:center;gap:8px;padding:${calmPadding};">
    <div style="flex:1;height:1px;background:#ef4444;"></div>
    <span class="text-meta-strong" style="color:#ef4444;">Now ${nowLabel}</span>
  </div>`;
}

function buildTimelineBlocks(timedItems = [], dateObj = getLocalTodayDate()) {
  const sorted = [...timedItems].sort((a, b) => {
    const aMinutes = agendaMinutesFromScheduled(a);
    const bMinutes = agendaMinutesFromScheduled(b);
    if (aMinutes === null && bMinutes === null) return 0;
    if (aMinutes === null) return 1;
    if (bMinutes === null) return -1;
    return aMinutes - bMinutes;
  });
  let html = '';
  let lastHour = null;
  const nowLine = buildNowLine(dateObj, sorted);
  const nowMinutes = localDateKey(dateObj) === localDateKey(getLocalTodayDate())
    ? (new Date().getHours() * 60 + new Date().getMinutes())
    : null;
  let nowInserted = false;

  if (sorted.length === 0) {
    return nowLine + html;
  }

  sorted.forEach((item, idx) => {
    const minutes = agendaMinutesFromScheduled(item);
    if (minutes === null) return;
    const hour = Math.floor(minutes / 60);
    if (hour !== lastHour) {
      html += `<div style="display:flex;align-items:center;gap:8px;padding:8px 0 2px;">
        <span class="text-meta" style="min-width:40px;">${String(hour).padStart(2, '0')}:00</span>
        <div style="flex:1;height:1px;background:#e5e7eb;"></div>
      </div>`;
      lastHour = hour;
    }
    if (!nowInserted && nowLine && nowMinutes !== null && nowMinutes <= minutes) {
      html += nowLine;
      nowInserted = true;
    }
    html += renderAgendaItemsListHtml([item]);
    if (!nowInserted && nowLine && nowMinutes !== null && idx === sorted.length - 1) {
      html += nowLine;
      nowInserted = true;
    }
  });
  return html;
}


