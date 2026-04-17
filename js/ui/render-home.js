async function renderWhatsNext() {
  const container = document.getElementById('whats-next-cards');
  if (!container) return;

  container.innerHTML = `<div style="color:#9ca3af;font-size:13px;padding:12px 0;">Loading…</div>`;

  try {
    const formula = encodeURIComponent(
      `AND(${activeTaskFilterFormula()}, NOT({Status}='Done'), NOT({Status}='Completed'))`
    );

    const data = await airtable(TABLES.tasks, `?filterByFormula=${formula}&maxRecords=20&sort[0][field]=Priority&sort[0][direction]=desc`);
    if (data.error) throw new Error(`Airtable ${data.error.type || 'error'}`);
    const rawRecords = data.records || [];
    const records = applyTaskDueFilter(rawRecords);

    function sel(v) {
      return (v && typeof v === 'object' && v.name) ? v.name : (v || '');
    }

    const priorityWeight = { High: 3, Medium: 2, Low: 1 };

    function getRecordFields(rec = {}) {
      if (rec.fields && typeof rec.fields === 'object') return rec.fields;
      if (rec.cellValuesByFieldId && typeof rec.cellValuesByFieldId === 'object') return rec.cellValuesByFieldId;
      return null;
    }

    function getField(rec, name) {
      const fields = getRecordFields(rec);
      if (!fields) return undefined;
      return fields[name];
    }

    records.sort((a, b) => {
      const scoreA = getField(a, 'Relevance Score') || 0;
      const scoreB = getField(b, 'Relevance Score') || 0;
      if (scoreB !== scoreA) return scoreB - scoreA;
      const prA = priorityWeight[sel(getField(a, 'Priority'))] || 0;
      const prB = priorityWeight[sel(getField(b, 'Priority'))] || 0;
      return prB - prA;
    });

    function assignPill(rec) {
      const st = sel(getField(rec, 'Suggestion Type'));
      if (st === 'Recommended') return 'recommended';
      if (st === 'Helpful')     return 'helpful';
      if (st === 'Later')       return 'later';
      const p = sel(getField(rec, 'Priority'));
      if (p === 'High')   return 'recommended';
      if (p === 'Medium') return 'helpful';
      return 'later';
    }

    const pillLabel = {
      recommended: t('whats_next_recommended') || 'Recommended',
      helpful:     t('whats_next_helpful')     || 'Helpful',
      later:       t('whats_next_later')        || 'Later'
    };

    const pillColor = {
      recommended: '#e8f5e9',
      helpful:     '#fff8e1',
      later:       '#f5f5f5'
    };

    const pillTextColor = {
      recommended: '#2e7d32',
      helpful:     '#f57f17',
      later:       '#757575'
    };

    function dueLabel(rec) {
      const d = getField(rec, 'Due Date');
      if (!d) return '';
      const today = new Date(); today.setHours(0,0,0,0);
      const due   = new Date(d); due.setHours(0,0,0,0);
      const diff  = Math.round((due - today) / 86400000);
      if (diff < 0)  return `<span style="color:#d32f2f;font-size:11px;">${t('due.overdue').replace('%d', Math.abs(diff))}</span>`;
      if (diff === 0) return `<span style="color:#f57f17;font-size:11px;">${t('due.today')}</span>`;
      if (diff === 1) return `<span style="color:#f57f17;font-size:11px;">${t('due.tomorrow')}</span>`;
      return `<span style="color:#757575;font-size:11px;">${t('due.in_days').replace('%d', diff)}</span>`;
    }

    const slots = ['recommended', 'helpful', 'later'];
    const picked = [];
    const used = new Set();

    for (const slot of slots) {
      const match = records.find(r => !used.has(r.id) && assignPill(r) === slot);
      if (match) { picked.push({ rec: match, pill: slot }); used.add(match.id); }
    }

    for (const rec of records) {
      if (picked.length >= 3) break;
      if (!used.has(rec.id)) {
        picked.push({ rec, pill: assignPill(rec) });
        used.add(rec.id);
      }
    }

    if (picked.length === 0) {
      container.innerHTML = `
        <div style="color:#9e9e9e;font-size:13px;padding:12px 0;">
          ${t('whats_next_empty') || 'No open tasks right now. You\'re on top of it.'}
        </div>`;
      return;
    }

    container.innerHTML = picked.map(({ rec, pill }) => {
      const taskFields = getRecordFields(rec) || {};
      const task   = getField(rec, 'Task') || '—';
      const reason = deriveTaskReasonText(taskFields);
      const source = taskSourceLabel(taskFields);
      const category = deriveTaskCategory(taskFields);
      const batchId = deriveTaskBatchId(taskFields);
      const brewLogId = deriveTaskBrewLogId(taskFields);
      const isDone = normalizeTaskStatus(getField(rec, 'Status')) === 'done';
      return `
        <div class="wn-card" data-task-id="${rec.id}" onclick="openTaskContext('${rec.id}','${batchId}','${brewLogId}')" style="
          background:#fff;
          border:1px solid #e0e0e0;
          border-radius:10px;
          padding:12px 14px;
          margin-bottom:8px;
          cursor:pointer;
          display:flex;
          flex-direction:column;
          gap:4px;
        ">
          <div style="display:flex;align-items:center;gap:8px;margin-bottom:2px;">
            <span style="
              background:${pillColor[pill]};
              color:${pillTextColor[pill]};
              font-size:10px;
              font-weight:600;
              padding:3px 8px;
              min-height:18px;
              border-radius:20px;
              letter-spacing:0.3px;
              text-transform:uppercase;
              display:inline-flex;
              align-items:center;
              justify-content:center;
              line-height:1;
              white-space:nowrap;
            ">${pillLabel[pill]}</span>
            ${dueLabel(rec)}
          </div>
          <div style="font-size:14px;font-weight:500;color:#212121;line-height:1.35;">${task}</div>
          <div class="task-context-line">Source: ${escapeHtml(source)} · ${escapeHtml(reason)}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:2px;">
            <span class="task-category-badge">${escapeHtml(category)}</span>
            <button class="btn btn-secondary" style="width:auto;min-height:auto;padding:6px 10px;margin:0;" onclick="toggleWhatsNextTaskCompletion(event,'${rec.id}',${isDone})">${isDone ? 'Reopen' : 'Done'}</button>
          </div>
        </div>`;
    }).join('');

  } catch (err) {
    console.error('[WhatsNext]', err);
    container.innerHTML = `
      <div style="color:#9e9e9e;font-size:13px;padding:12px 0;">
        ${t('whats_next_error') || 'Could not load tasks.'}
      </div>`;
  }
}

async function toggleWhatsNextTaskCompletion(event, taskId, isDone) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }
  const nextIsDone = !isDone;
  const card = document.querySelector(`.wn-card[data-task-id="${taskId}"]`);
  if (card && nextIsDone) card.style.opacity = '0.4';
  try {
    await toggleTaskStatusEverywhere(taskId, nextIsDone);
  } catch (error) {
    if (card) card.style.opacity = '1';
    console.warn('[WhatsNext] status toggle failed', error);
    toast('Could not update task status');
  }
}

// ── HOME BATCH LIST ──────────────────────────────────────────────────────────
function renderHomeBatches(batches) {
  const container = document.getElementById('home-batch-list');
  if (!container) return;
  if (!batches || batches.length === 0) {
    container.innerHTML = `<p style="font-size:14px; color:#9ca3af; margin:0;">${t('home.no_active_batches')}</p>`;
    return;
  }
  container.innerHTML = batches.slice(0, 3).map(b => {
    const fields = b.fields || {};
    const status = sel(fields['Status']) || 'Unknown';
    const batchLabel = resolveBatchLabel(b);
    const summaryRaw = fields['Summary Line'] || status;
    const summary = String(summaryRaw || '').toLowerCase() === 'process_run'
      ? displayStatus(status)
      : summaryRaw;
    const statusPillClass = pillClassFromStatus(status);
    return `
      <div onclick="openBatchDetail('${b.id}')" style="background:#fff; border:1.5px solid #f3f4f6; border-radius:16px; padding:16px; cursor:pointer; display:flex; justify-content:space-between; align-items:center;">
        <div>
          <p style="font-size:15px; font-weight:600; color:#111827; margin:0 0 4px;">${batchLabel}</p>
          <p style="font-size:13px; color:#6b7280; margin:0;">${summary}</p>
        </div>
        <span class="badge indicator-pill ${statusPillClass}" aria-label="${displayStatus(status)}"></span>
      </div>`;
  }).join('');
}

function openBatchDetail(recordId) {
  showScreen('screen-batch-detail');
  if (typeof loadBatchDetail === 'function') loadBatchDetail(recordId);
}

function getAgendaPreviewItems() {
  if (Array.isArray(window._agendaCache) && window._agendaCache.length) {
    return window._agendaCache.slice(0, 3).map(item => {
      const scheduledDate = typeof scheduledItemToDate === 'function'
        ? scheduledItemToDate(item.scheduledTime)
        : null;
      const time = item.scheduledTime && scheduledDate && !(typeof isUntimedDateItem === 'function' && isUntimedDateItem(item))
        ? scheduledDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : null;
      return {
        time,
        title: item.title || '—',
        system: Boolean(item.isSystem)
      };
    });
  }

  if (typeof getAgendaPreviewFallbackItems === 'function') {
    return getAgendaPreviewFallbackItems();
  }

  return [];
}

function renderAgendaPreview() {
  const container = document.getElementById('home-agenda-preview');
  if (!container) return;
  const items = getAgendaPreviewItems();
  if (!items.length) {
    container.innerHTML = `<p style="font-size:13px;color:#9ca3af;margin:0;">${t('agenda.none_scheduled')}</p>`;
    return;
  }
  container.innerHTML = items.map(item => `
    <div style="background:#fff; border:1.5px solid #f3f4f6; border-radius:12px; padding:12px 14px; display:flex; align-items:center; gap:12px;">
      <span style="font-size:12px; color:#9ca3af; min-width:36px;">${item.time || '—'}</span>
      ${item.system ? '<span style="font-size:12px;" title="Généré automatiquement">✦</span>' : '<span style="min-width:14px;"></span>'}
      <p style="font-size:14px; color:#111827; margin:0;">${item.title}</p>
    </div>`).join('');
}

// ── HOME SECTION LABELS ──────────────────────────────────────────────────────
function applyHomeLabels() {
  const setEl = (id, key) => { const el = document.getElementById(id); if (el) el.textContent = t(key); };
  setEl('home-title', 'home.today');
  setEl('home-whats-next-label', 'home.whats_next');
  setEl('home-batches-label', 'home.active_batches');
  setEl('home-agenda-label', 'home.agenda');
  setEl('home-agenda-more', 'agenda.see_more');
  setEl('home-financial-label', 'home.financial');
}
