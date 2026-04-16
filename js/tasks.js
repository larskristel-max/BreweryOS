// Extracted task-specific helpers and task operations.

function deriveTaskSourceKeyFromDescription(text = '') {
  const m = String(text || '').match(/\[source_key:([a-z0-9_\-:.]+)\]/i);
  return m ? m[1] : '';
}

function normalizeTaskStatus(raw = '') {
  const s = String(sel(raw) || raw || '').toLowerCase();
  if (!s) return 'todo';
  if (['done', 'completed', 'complete'].includes(s)) return 'done';
  return 'todo';
}

function normalizeBatchLifecycleStatus(rawStatus = '') {
  const s = String(sel(rawStatus) || rawStatus || '').toLowerCase();
  if (s === 'planned') return 'planned';
  if (s === 'brewing' || s === 'in_progress') return 'brewing';
  if (s === 'fermenting') return 'fermenting';
  if (s === 'ready' || s === 'ready_for_execution') return 'ready';
  return '';
}

function buildTaskDescriptionWithMeta(baseText = '', sourceKey = '', source = 'automatic') {
  const lines = [baseText || ''];
  lines.push(`Source: ${source}`);
  if (sourceKey) lines.push(`[source_key:${sourceKey}]`);
  return lines.filter(Boolean).join('\n');
}

function isoNow() {
  return new Date().toISOString();
}

const TASK_STATUS_ALLOWED = new Set(['To Do', 'In Progress', 'Done', 'Skipped']);
const TASK_SOURCE_ALLOWED = new Set(['System', 'Manual']);

function asSingleSelectOption(value, allowedSet) {
  const raw = typeof value === 'object' && value !== null ? value.name : value;
  const name = String(raw || '').trim();
  if (!name || !allowedSet.has(name)) return undefined;
  return name;
}

function buildTaskCreateFields(rawFields = {}) {
  const fields = {};
  const task = String(rawFields['Task'] || '').trim();
  if (task) fields['Task'] = task;
  fields['Created At'] = isoNow();

  const status = asSingleSelectOption(rawFields['Status'] || 'To Do', TASK_STATUS_ALLOWED);
  if (status) fields['Status'] = status;

  const source = asSingleSelectOption(rawFields['Source'], TASK_SOURCE_ALLOWED);
  if (source) fields['Source'] = source;

  if (rawFields['Due Date']) fields['Due Date'] = rawFields['Due Date'];
  if (rawFields['Scheduled Time']) fields['Scheduled Time'] = rawFields['Scheduled Time'];
  if (rawFields['Notes']) fields['Notes'] = String(rawFields['Notes']);
  if (rawFields['Description']) fields['Description'] = String(rawFields['Description']);
  if (rawFields['Source Key']) fields['Source Key'] = String(rawFields['Source Key']);

  const batch = Array.isArray(rawFields['Linked Batch']) ? rawFields['Linked Batch'].filter(Boolean) : [];
  if (batch.length) fields['Linked Batch'] = batch;
  const brewLog = Array.isArray(rawFields['Linked Brew Log']) ? rawFields['Linked Brew Log'].filter(Boolean) : [];
  if (brewLog.length) fields['Linked Brew Log'] = brewLog;

  return fields;
}

function deriveTaskBatchId(fields = {}) {
  const linkedBatch = fields['Linked Batch'];
  const linkedBatchId = Array.isArray(linkedBatch)
    ? (typeof linkedBatch[0] === 'string' ? linkedBatch[0] : linkedBatch[0]?.id)
    : '';
  return (
    linkedBatchId ||
    (Array.isArray(fields['Batch']) && fields['Batch'][0]) ||
    fields['Linked Batch ID'] ||
    fields['Batch ID'] ||
    ''
  );
}

function deriveTaskBrewLogId(fields = {}) {
  const linkedBrewLog = fields['Linked Brew Log'];
  const linkedBrewLogId = Array.isArray(linkedBrewLog)
    ? (typeof linkedBrewLog[0] === 'string' ? linkedBrewLog[0] : linkedBrewLog[0]?.id)
    : '';
  return (
    linkedBrewLogId ||
    (Array.isArray(fields['Brew Log']) && fields['Brew Log'][0]) ||
    fields['Linked Brew Log ID'] ||
    fields['Brew Log ID'] ||
    ''
  );
}

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

async function fetchTasksForOps() {
  const data = await airtable(TABLES.tasks, '?maxRecords=200');
  return data.records || [];
}

async function createTaskRecordWithFallback(fields) {
  const payload = buildTaskCreateFields(fields);
  const PROTECTED_FIELDS = new Set(['Task', 'Scheduled Time', 'Due Date', 'Status', 'Source']);
  for (let i = 0; i < 8; i++) {
    console.log('TASK CREATE PAYLOAD', payload);
    const res = await airtableCreate(TABLES.tasks, payload);
    if (!res?.error) return res;
    const msg = String(res?.error?.message || '');
    console.error('TASK CREATE FAILED', res);
    const match = msg.match(/Unknown field name:\s*\"([^\"]+)\"/i);
    if (!match) throw new Error(msg || 'Task create failed');
    if (PROTECTED_FIELDS.has(match[1])) {
      throw new Error(`Protected field rejected by Airtable: ${match[1]}`);
    }
    delete payload[match[1]];
  }
  throw new Error('Task create fallback exhausted');
}

async function ensureOperationalTask({
  title,
  description = '',
  priority = 'Medium',
  dueDate = null,
  batchId = '',
  brewLogId = '',
  source = 'System',
  sourceKey
}) {
  if (!sourceKey || !title) return;
  const allTasks = await fetchTasksForOps();
  const duplicate = allTasks.find((rec) => {
    const f = rec.fields || {};
    const existingKey = f['Source Key'] || deriveTaskSourceKeyFromDescription(f['Description'] || f['Notes'] || '');
    const existingBatchId = deriveTaskBatchId(f);
    const existingBrewLogId = deriveTaskBrewLogId(f);
    const brewLogCompatible = !brewLogId || !existingBrewLogId || existingBrewLogId === brewLogId;
    return existingKey === sourceKey
      && (!batchId || existingBatchId === batchId)
      && brewLogCompatible;
  });
  if (duplicate) {
    const duplicateFields = duplicate.fields || {};
    const existingBrewLogId = deriveTaskBrewLogId(duplicateFields);
    if (brewLogId && !existingBrewLogId) {
      await airtablePatch(TABLES.tasks, duplicate.id, { 'Linked Brew Log': [brewLogId] })
        .catch((error) => console.warn('Could not backfill brew log link on operational task', error));
    }
    return duplicate;
  }

  const taskFields = {
    'Task': title,
    'Status': 'To Do',
    'Due Date': dueDate || undefined,
    'Notes': buildTaskDescriptionWithMeta(description, sourceKey, source),
    'Source': source,
    'Source Key': sourceKey
  };
  if (batchId) {
    taskFields['Linked Batch'] = [batchId];
  }
  if (brewLogId) {
    taskFields['Linked Brew Log'] = [brewLogId];
  }
  return createTaskRecordWithFallback(taskFields);
}

let cachedTaskBatchRecords = [];
let taskEditState = { taskId: '' };
let taskDueFilter = 'all';
let taskCreateViewportBound = false;
let taskCreateViewportListener = null;

function taskCreateDateAndTimeFromFields(fields = {}) {
  const scheduledRaw = String(fields['Scheduled Time'] || '').trim();
  const dueRaw = String(fields['Due Date'] || '').trim();
  const fallbackDate = parseLocalDateKey(dueRaw);
  if (!scheduledRaw) {
    return {
      date: fallbackDate ? localDateKey(fallbackDate) : '',
      time: ''
    };
  }
  const scheduledDate = scheduledItemToDate(scheduledRaw);
  if (!scheduledDate) {
    return {
      date: fallbackDate ? localDateKey(fallbackDate) : '',
      time: ''
    };
  }
  const date = localDateKey(scheduledDate);
  const isUntimed = scheduledDate.getHours() === 0
    && scheduledDate.getMinutes() === 0
    && scheduledDate.getSeconds() === 0;
  const time = isUntimed ? '' : `${String(scheduledDate.getHours()).padStart(2, '0')}:${String(scheduledDate.getMinutes()).padStart(2, '0')}`;
  return { date, time };
}

function clearTaskCreateViewportOffset() {
  document.documentElement.style.setProperty('--keyboard-offset', '0px');
}

function refreshTaskCreateViewportOffset() {
  const sheet = document.getElementById('task-create-sheet');
  if (!sheet || !sheet.classList.contains('open')) {
    clearTaskCreateViewportOffset();
    return;
  }
  const vv = window.visualViewport;
  if (!vv) {
    clearTaskCreateViewportOffset();
    return;
  }
  const overlap = Math.max(0, window.innerHeight - vv.height - vv.offsetTop);
  const comfortBuffer = overlap > 0 ? 16 : 0;
  document.documentElement.style.setProperty('--keyboard-offset', `${Math.round(overlap + comfortBuffer)}px`);
}

function bindTaskCreateViewportTracking() {
  if (taskCreateViewportBound) return;
  taskCreateViewportBound = true;
  const vv = window.visualViewport;
  if (!vv) return;
  taskCreateViewportListener = () => refreshTaskCreateViewportOffset();
  vv.addEventListener('resize', taskCreateViewportListener);
  vv.addEventListener('scroll', taskCreateViewportListener);
}

function unbindTaskCreateViewportTracking() {
  if (!taskCreateViewportBound) return;
  taskCreateViewportBound = false;
  const vv = window.visualViewport;
  if (vv && taskCreateViewportListener) {
    vv.removeEventListener('resize', taskCreateViewportListener);
    vv.removeEventListener('scroll', taskCreateViewportListener);
  }
  taskCreateViewportListener = null;
  clearTaskCreateViewportOffset();
}

document.addEventListener('focusin', (event) => {
  const sheet = document.getElementById('task-create-sheet');
  if (!sheet || !sheet.classList.contains('open')) return;
  if (!event.target || !sheet.contains(event.target)) return;
  if (!(event.target instanceof HTMLElement)) return;
  setTimeout(() => {
    event.target.scrollIntoView({ block: 'nearest', inline: 'nearest' });
    refreshTaskCreateViewportOffset();
  }, 40);
});

function hydrateTaskCreateBatchOptions() {
  const select = document.getElementById('task-create-batch');
  if (!select) return;
  const currentValue = select.value;
  const options = [`<option value="">${escapeHtml(t('task.no_linked_batch'))}</option>`]
    .concat(cachedTaskBatchRecords.map((record) => `<option value="${record.id}">${escapeHtml(resolveBatchLabel(record))}</option>`));
  select.innerHTML = options.join('');
  if (currentValue) select.value = currentValue;
}

function toggleTaskCreateForm(forceOpen) {
  const sheet = document.getElementById('task-create-sheet');
  const backdrop = document.getElementById('task-create-backdrop');
  const input = document.getElementById('task-create-title');
  const dateInput = document.getElementById('task-create-date');
  const timeInput = document.getElementById('task-create-time');
  const saveBtn = document.getElementById('task-create-save-btn');
  if (!sheet || !backdrop) return;
  const shouldOpen = typeof forceOpen === 'boolean' ? forceOpen : !sheet.classList.contains('open');
  backdrop.classList.toggle('open', shouldOpen);
  sheet.classList.toggle('open', shouldOpen);
  backdrop.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  sheet.setAttribute('aria-hidden', shouldOpen ? 'false' : 'true');
  if (!shouldOpen) {
    taskEditState.taskId = '';
    if (input) input.value = '';
    if (dateInput) dateInput.value = '';
    if (timeInput) timeInput.value = '';
    const batchSelect = document.getElementById('task-create-batch');
    if (batchSelect) batchSelect.value = '';
    if (saveBtn) saveBtn.textContent = t('task.save');
    unbindTaskCreateViewportTracking();
    return;
  }
  if (saveBtn) saveBtn.textContent = taskEditState.taskId ? t('task.save_changes') : t('task.save');
  hydrateTaskCreateBatchOptions();
  bindTaskCreateViewportTracking();
  refreshTaskCreateViewportOffset();
  setTimeout(() => {
    if (input) input.focus();
    refreshTaskCreateViewportOffset();
  }, 0);
}

function cancelTaskCreateOrEdit() {
  toggleTaskCreateForm(false);
}

async function startTaskEdit(event, taskId) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  closeTaskActionMenus();
  const input = document.getElementById('task-create-title');
  const batchSelect = document.getElementById('task-create-batch');
  const dateInput = document.getElementById('task-create-date');
  const timeInput = document.getElementById('task-create-time');
  try {
    const taskData = await airtable(TABLES.tasks, `/${taskId}`);
    const fields = taskData?.fields || {};
    taskEditState.taskId = taskId;
    toggleTaskCreateForm(true);
    if (input) input.value = String(fields['Task'] || '').trim();
    if (batchSelect) batchSelect.value = deriveTaskBatchId(fields) || '';
    const dateAndTime = taskCreateDateAndTimeFromFields(fields);
    if (dateInput) dateInput.value = dateAndTime.date;
    if (timeInput) timeInput.value = dateAndTime.time;
  } catch (error) {
    console.warn('Unable to load task for edit:', error);
    toast('Could not open task editor');
  }
}

function activeTaskFilterFormula() {
  return "AND(OR({Is Archived}=FALSE(), {Is Archived}=BLANK()), OR({Is Deleted}=FALSE(), {Is Deleted}=BLANK()))";
}

function parseDateAtMidnight(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  d.setHours(0, 0, 0, 0);
  return d;
}

function getLocalTodayDate() {
  return startOfLocalDay(new Date());
}

function localDateKey(date) {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseLocalDateKey(key) {
  const match = String(key || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  const date = new Date(Number(y), Number(m) - 1, Number(d));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getFullYear() !== Number(y) || date.getMonth() !== Number(m) - 1 || date.getDate() !== Number(d)) return null;
  return startOfLocalDay(date);
}

function normalizeAgendaScheduleValue(value, forceDateOnly = false) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) {
    const local = parseLocalDateKey(raw);
    if (!local) return null;
    return new Date(local.getFullYear(), local.getMonth(), local.getDate(), 0, 0, 0, 0).toISOString();
  }
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  if (forceDateOnly) {
    return new Date(dt.getFullYear(), dt.getMonth(), dt.getDate(), 0, 0, 0, 0).toISOString();
  }
  return raw;
}

function normalizeTaskScheduledValue(scheduledValue, dueDateFallback) {
  const normalizedScheduled = normalizeAgendaScheduleValue(scheduledValue, false);
  if (normalizedScheduled) return normalizedScheduled;
  return normalizeAgendaScheduleValue(dueDateFallback, true)
    || null;
}

function startOfLocalDay(date) {
  const out = new Date(date.getTime());
  out.setHours(0, 0, 0, 0);
  return out;
}

function startOfLocalWeek(date) {
  const out = startOfLocalDay(date);
  const day = out.getDay();
  const delta = day === 0 ? -6 : 1 - day;
  out.setDate(out.getDate() + delta);
  return out;
}

function addDaysLocal(date, n) {
  const out = startOfLocalDay(date);
  out.setDate(out.getDate() + n);
  return out;
}

function isSameLocalDay(a, b) {
  if (!(a instanceof Date) || !(b instanceof Date)) return false;
  return a.getFullYear() === b.getFullYear()
    && a.getMonth() === b.getMonth()
    && a.getDate() === b.getDate();
}

function scheduledItemToDate(value) {
  const raw = String(value || '').trim();
  if (!raw) return null;
  const dateOnlyMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (dateOnlyMatch) return parseLocalDateKey(raw);
  const dt = new Date(raw);
  if (Number.isNaN(dt.getTime())) return null;
  return dt;
}

function getTaskPrimaryDateMeta(fields = {}) {
  const scheduledRaw = String(fields['Scheduled Time'] || '').trim();
  const dueRaw = String(fields['Due Date'] || '').trim();
  const rawPrimary = scheduledRaw || dueRaw;
  if (!rawPrimary) return null;
  const dt = scheduledItemToDate(rawPrimary);
  if (!(dt instanceof Date) || Number.isNaN(dt.getTime())) return null;
  const hasTime = scheduledRaw
    ? !isUntimedDateItem({ scheduledTime: rawPrimary })
    : !/^\d{4}-\d{2}-\d{2}$/.test(rawPrimary);
  return { date: dt, hasTime, raw: rawPrimary };
}

function formatTaskPrimaryDateLabel(fields = {}) {
  const meta = getTaskPrimaryDateMeta(fields);
  if (!meta) return t('task.no_due_date');
  const now = new Date();
  const today = startOfLocalDay(now);
  const tomorrow = addDaysLocal(today, 1);
  const targetDay = startOfLocalDay(meta.date);
  const timePart = meta.hasTime
    ? ` ${meta.date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`
    : '';
  if (isSameLocalDay(targetDay, today)) return `${t('due.today')}${timePart}`;
  if (isSameLocalDay(targetDay, tomorrow)) return `${t('due.tomorrow')}${timePart}`;
  const datePart = meta.date.toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' });
  return `${datePart}${timePart}`;
}

function deriveTaskReasonText(fields = {}) {
  const suggestionReason = String(fields['Suggestion Reason'] || '').trim();
  if (suggestionReason) return suggestionReason;
  const suggestionType = sel(fields['Suggestion Type']);
  if (suggestionType) return `Created from ${suggestionType.toLowerCase()} suggestion`;
  const source = sel(fields['Source']);
  if (String(source).toLowerCase() === 'manual') return 'Manual task';
  if (String(source).toLowerCase() === 'system') return 'Created from batch transition';
  return 'Readiness check required';
}

function taskSourceLabel(fields = {}) {
  const source = sel(fields['Source']);
  return source || 'System';
}

function deriveTaskCategory(fields = {}) {
  const source = String(sel(fields['Source']) || '').toLowerCase();
  const suggestionType = String(sel(fields['Suggestion Type']) || '').toLowerCase();
  const reason = `${fields['Suggestion Reason'] || ''} ${fields['Task'] || ''}`.toLowerCase();
  if (reason.includes('inventory') || reason.includes('stock') || suggestionType.includes('inventory')) return 'Inventory';
  if (reason.includes('tax') || reason.includes('excise') || reason.includes('compliance') || suggestionType.includes('compliance')) return 'Compliance';
  if (reason.includes('cost') || reason.includes('invoice') || reason.includes('finance') || suggestionType.includes('finance')) return 'Finance';
  if (source === 'manual') return 'Brewing';
  return 'Brewing';
}

function isTaskOverdue(fields = {}) {
  const primary = getTaskPrimaryDateMeta(fields)?.date || null;
  if (!primary) return false;
  const status = normalizeTaskStatus(fields['Status']);
  if (status === 'done') return false;
  return primary < new Date();
}

function applyTaskDueFilter(records = []) {
  if (taskDueFilter === 'all') return records;
  const now = new Date();
  const today = startOfLocalDay(now);
  return records.filter((record) => {
    const fields = record.fields || {};
    const primary = getTaskPrimaryDateMeta(fields)?.date || null;
    if (!primary) return false;
    if (taskDueFilter === 'today') return isSameLocalDay(primary, today);
    if (taskDueFilter === 'upcoming') return startOfLocalDay(primary) > today;
    if (taskDueFilter === 'overdue') return isTaskOverdue(fields);
    return true;
  });
}

function setTaskDueFilter(nextFilter = 'all') {
  taskDueFilter = nextFilter;
  ['all', 'today', 'upcoming', 'overdue'].forEach((key) => {
    const btn = document.getElementById(`task-filter-${key}`);
    if (btn) btn.classList.toggle('active', key === nextFilter);
  });
  loadTasks();
}


async function saveTaskFromTasksScreen() {
  const input = document.getElementById('task-create-title');
  const batchSelect = document.getElementById('task-create-batch');
  const dateInput = document.getElementById('task-create-date');
  const timeInput = document.getElementById('task-create-time');
  const safeTitle = String(input?.value || '').trim();
  if (!safeTitle) {
    toast('Enter a task title');
    return;
  }
  const linkedBatch = String(batchSelect?.value || '').trim();
  const dueDate = String(dateInput?.value || '').trim();
  const timeValue = String(timeInput?.value || '').trim();
  if (timeValue && !dueDate) {
    toast('Select a date to use a time');
    return;
  }
  const scheduledTime = (dueDate && timeValue) ? buildScheduledTimeFromInputs(dueDate, timeValue) : null;
  const isEditing = Boolean(taskEditState.taskId);
  try {
    if (isEditing) {
      const patchPayload = {
        'Task': safeTitle,
        'Linked Batch': linkedBatch ? [linkedBatch] : [],
        'Due Date': dueDate || null,
        'Scheduled Time': scheduledTime || null
      };
      console.log('TASK EDIT PATCH PAYLOAD', { taskId: taskEditState.taskId, payload: patchPayload });
      await airtablePatch(TABLES.tasks, taskEditState.taskId, patchPayload);
      toast('Task updated');
    } else {
      const createPayload = {
        'Task': safeTitle,
        'Status': 'To Do',
        'Source': 'Manual',
        ...(dueDate ? { 'Due Date': dueDate } : {}),
        ...(scheduledTime ? { 'Scheduled Time': scheduledTime } : {})
      };
      if (linkedBatch) createPayload['Linked Batch'] = [linkedBatch];
      console.log('TASK CREATE PAYLOAD', createPayload);
      await createTaskRecordWithFallback(createPayload);
      toast('Task created');
    }
    toggleTaskCreateForm(false);
    await loadTasks();
    renderWhatsNext();
    loadAgendaFromAirtable();
  } catch (error) {
    console.error(isEditing ? 'TASK EDIT FAILED' : 'TASK CREATE FAILED', error);
    console.warn(isEditing ? 'Task edit failed:' : 'Manual task create failed:', error);
    toast(isEditing ? 'Could not update task' : 'Could not create task');
  }
}


async function runTaskSyncSafely(batchRecord, brewLogId = '') {
  try {
    await syncBatchOperationalTasks(batchRecord, brewLogId);
  } catch (error) {
    console.warn('Task sync skipped for this flow:', error);
  }
}

async function syncBatchOperationalTasks(batchRecord, brewLogId = '') {
  const f = batchRecord?.fields || {};
  const batchId = batchRecord?.id || '';
  if (!batchId) return;
  const lifecycle = normalizeBatchLifecycleStatus(f['Status']);
  const stageTaskMap = {
    brewing:   'Confirm mash parameters recorded',
    fermenting:'Monitor fermentation / log gravity',
    ready:     'Schedule packaging / confirm FG'
  };
  if (stageTaskMap[lifecycle]) {
    await ensureOperationalTask({
      title: stageTaskMap[lifecycle],
      description: `Lifecycle transition follow-up for ${resolveBatchLabel(batchRecord)}.`,
      batchId,
      brewLogId,
      source: 'System',
      sourceKey: `batch_stage:${batchId}:${lifecycle}`
    });
  }
  const prevMap = JSON.parse(localStorage.getItem('brewos_batch_stage_map') || '{}');
  if (prevMap[batchId] !== lifecycle) {
    prevMap[batchId] = lifecycle;
    localStorage.setItem('brewos_batch_stage_map', JSON.stringify(prevMap));
  }

  const readiness = SEMANTIC.computeReadiness(f, {}, APP_READINESS_CONDITIONS);
  if (!readiness.ready) {
    const conditionToTask = {
      material_availability: 'Resolve missing materials for batch',
      process_completion_state: 'Complete required process steps',
      system_readiness: 'Resolve system readiness blockers',
      measurement_reliability: 'Complete or verify required measurements',
      output_lot_integrity: 'Create or validate output lot records',
      control_execution_validity: 'Complete required control execution checks'
    };
    for (const condition of APP_READINESS_CONDITIONS) {
      if (!readiness.failing.includes(condition.label)) continue;
      const title = conditionToTask[condition.sourceKey] || `Resolve readiness block: ${condition.label}`;
      await ensureOperationalTask({
        title,
        description: `Readiness failed for ${resolveBatchLabel(batchRecord)} (${condition.label}).`,
        batchId,
        brewLogId,
        source: 'System',
        sourceKey: `readiness:${batchId}:${condition.sourceKey || readinessTaskKeyLabel(condition.label)}`
      });
    }
  }
}

async function createOverrideReviewTask({ batchId, batchLabel, reason, brewLogId = '' }) {
  const safeReason = (reason || '').trim();
  await ensureOperationalTask({
    title: `Review overridden readiness for ${batchLabel}`,
    description: safeReason ? `Override reason: ${safeReason}` : 'Readiness override logged without explicit reason.',
    batchId,
    brewLogId,
    source: 'System',
    sourceKey: `override:${batchId}:${readinessTaskKeyLabel(safeReason || 'no_reason')}`
  });
}

async function overrideBatchReadiness(batchId, batchLabel) {
  const reason = window.prompt('Why are you overriding readiness?', '');
  if (reason === null) return;
  const logsData = await getBrewLogsForBatch(batchId, {});
  const brewLogId = logsData.records?.[0]?.id || '';
  await createOverrideReviewTask({ batchId, batchLabel, reason, brewLogId });
  toast('Readiness override logged with review task');
  loadTasks();
}
