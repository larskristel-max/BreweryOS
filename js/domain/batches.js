function batchCard(r) {
  const f      = r.fields;
  const recipe = Array.isArray(f.Recipe) ? f.Recipe[0] : '';
  const status = sel(f.Status) || 'Unknown';
  const type   = getObjectType('Batches');
  const batchName = resolveBatchLabel(r);
  return `
    <div class="batch-card" onclick="loadBatchDetail('${r.id}')">
      <div class="batch-card-header">
        <div>
          <div class="batch-name">${batchName}${recipe ? ` — ${recipe}` : ''}</div>
          <div class="batch-date">${f.Date || '—'}</div>
        </div>
        ${readinessBadge(f, type)}
      </div>
      <div class="batch-meta">
        ${statusBadge(status)}
        ${objectTypeTag(type)}
      </div>
    </div>`;
}

async function loadBatches() {
  showScreen('screen-batches');
  const data = await airtable(TABLES.batches, '?sort[0][field]=Date&sort[0][direction]=desc');
  const el = document.getElementById('batch-list');
  if (!data.records?.length) { el.innerHTML = `<div class="empty">${t('batch.no_batches')}</div>`; return; }
  el.innerHTML = data.records.map(r => batchCard(r)).join('');
}

const BATCH_DETAIL_EDIT_FIELDS = {
  'Mash Temp Actual': { label: 'Temp', type: 'number', step: '0.1', section: 'mash' },
  'Mash pH Actual': { label: 'pH', type: 'number', step: '0.01', section: 'mash' },
  'Mash Start Time': { label: 'Start Time', type: 'text', section: 'mash' },
  'Pre-boil Volume Actual': { label: 'Pre-boil Volume', type: 'number', step: '1', section: 'boil' },
  'Pre-boil Gravity Actual': { label: 'Pre-boil Gravity', type: 'number', step: '0.001', section: 'boil' },
  'Boil Duration Confirmed': { label: 'Boil Confirmed', type: 'checkbox', section: 'boil' },
  'Hop Additions Notes': { label: 'Hop Notes', type: 'textarea', section: 'boil' },
  'Transfer Volume Actual': { label: 'Transfer Volume', type: 'number', step: '1', section: 'transfer' },
  'OG Actual': { label: 'OG Actual', type: 'number', step: '0.001', section: 'transfer' },
  'Transfer Temp Actual': { label: 'Transfer Temp', type: 'number', step: '1', section: 'transfer' },
  'Fermenter ID': { label: 'Fermenter', type: 'text', section: 'transfer' },
  'FG Actual': { label: 'FG Actual', type: 'number', step: '0.001', section: 'transfer' }
};

let batchDetailEditState = {
  recordId: null,
  isEditing: false,
  brewLogId: null,
  original: {},
  draft: {}
};
let batchDetailLoadedState = {
  recordId: null,
  brewLogId: null,
  log: {}
};

function startBatchDetailEdit(recordId) {
  const loadedLog = batchDetailLoadedState.recordId === recordId ? batchDetailLoadedState.log : {};
  batchDetailEditState = {
    recordId,
    isEditing: true,
    brewLogId: batchDetailLoadedState.recordId === recordId ? batchDetailLoadedState.brewLogId : null,
    original: { ...(loadedLog || {}) },
    draft: { ...(loadedLog || {}) }
  };
  loadBatchDetail(recordId);
}

function cancelBatchDetailEdit(recordId) {
  batchDetailEditState.isEditing = false;
  batchDetailEditState.draft = { ...batchDetailEditState.original };
  loadBatchDetail(recordId);
}

function onBatchDetailDraftChange(field, type, event) {
  if (!batchDetailEditState.isEditing) return;
  if (type === 'checkbox') {
    batchDetailEditState.draft[field] = !!event.target.checked;
    return;
  }
  batchDetailEditState.draft[field] = event.target.value;
}

function buildBatchDetailPatchPayload(original, draft) {
  const payload = {};
  Object.keys(BATCH_DETAIL_EDIT_FIELDS).forEach((field) => {
    const type = BATCH_DETAIL_EDIT_FIELDS[field].type;
    const originalVal = original?.[field];
    const draftValRaw = draft?.[field];
    let parsed;
    if (type === 'number') {
      if (draftValRaw === '' || draftValRaw === null || typeof draftValRaw === 'undefined') parsed = null;
      else {
        const n = parseFloat(draftValRaw);
        parsed = Number.isFinite(n) ? n : null;
      }
    } else if (type === 'checkbox') {
      parsed = !!draftValRaw;
    } else {
      parsed = draftValRaw === '' || typeof draftValRaw === 'undefined' ? null : draftValRaw;
    }
    if ((originalVal ?? null) !== (parsed ?? null)) payload[field] = parsed;
  });
  return payload;
}

async function saveBatchDetailEdit(recordId) {
  const state = batchDetailEditState;
  if (!state.isEditing || state.recordId !== recordId) return;
  const logsData = await getBrewLogsForBatch(recordId, {});
  const liveLog = logsData.records?.[0] || null;
  const brewLogId = liveLog?.id || state.brewLogId;
  const original = liveLog?.fields || state.original || {};
  const payload = buildBatchDetailPatchPayload(original, state.draft || {});
  if (!Object.keys(payload).length) {
    batchDetailEditState.isEditing = false;
    await loadBatchDetail(recordId);
    return;
  }
  if (brewLogId) {
    await airtablePatch(TABLES.brewLogs, brewLogId, payload);
  } else {
    await airtableCreate(TABLES.brewLogs, {
      'Batch': [recordId],
      ...payload
    });
  }
  batchDetailEditState.isEditing = false;
  batchDetailEditState.draft = {};
  batchDetailEditState.original = {};
  await loadBatchDetail(recordId);
}

function batchDetailEditableValue(field) {
  const cfg = BATCH_DETAIL_EDIT_FIELDS[field] || {};
  const value = batchDetailEditState.draft?.[field];
  if (!batchDetailEditState.isEditing || cfg.type === 'checkbox') return null;
  if (cfg.type === 'textarea') {
    return `<textarea oninput="onBatchDetailDraftChange('${field.replace(/'/g, "\\'")}', '${cfg.type}', event)">${value || ''}</textarea>`;
  }
  if (cfg.type === 'number') {
    const step = cfg.step ? `step="${cfg.step}"` : '';
    return `<input type="number" ${step} value="${value ?? ''}" oninput="onBatchDetailDraftChange('${field.replace(/'/g, "\\'")}', '${cfg.type}', event)">`;
  }
  return `<input type="text" value="${value ?? ''}" oninput="onBatchDetailDraftChange('${field.replace(/'/g, "\\'")}', '${cfg.type}', event)">`;
}

async function loadBatchDetail(recordId) {
  showScreen('screen-batch-detail');
  setCurrentRecord('Batches', recordId);
  const el = document.getElementById('batch-detail-content');
  el.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const batchData = await airtable(TABLES.batches, `/${recordId}`);
  const logsData = await getBrewLogsForBatch(recordId, batchData.fields || {});

  const f       = batchData.fields;
  const recipe  = Array.isArray(f.Recipe) ? f.Recipe[0] : '';
  const targets = RECIPE_TARGETS[recipe] || {};
  const brewLogRecord = logsData.records?.[0] || null;
  const brewLogId = brewLogRecord?.id || null;
  const log     = logsData.records?.[0]?.fields || {};
  batchDetailLoadedState = { recordId, brewLogId, log: { ...log } };
  const status  = sel(f.Status) || 'Unknown';
  const objType = APP_STATE.currentObjectType;
  const isEditing = batchDetailEditState.isEditing && batchDetailEditState.recordId === recordId;
  const readinessState = objType === 'process_run'
    ? SEMANTIC.computeReadiness(f, {}, APP_READINESS_CONDITIONS)
    : { ready: true, failing: [] };

  if (isEditing && Object.keys(batchDetailEditState.draft || {}).length === 0) {
    batchDetailEditState.draft = { ...log };
    batchDetailEditState.original = { ...log };
    batchDetailEditState.brewLogId = brewLogId;
  }

  function compare(actual, target) {
    if (!actual || !target) return `<span class="detail-value">${actual || '—'}</span>`;
    const pct = Math.abs((actual - target) / target * 100);
    const cls = pct <= 2 ? 'val-good' : pct <= 5 ? 'val-warn' : 'val-bad';
    return `<span class="detail-value ${cls}">${actual}<span class="vs-target"> target ${target}</span></span>`;
  }
  function renderReadOnlyValue(value, suffix = '') {
    return `<span class="detail-value">${value || '—'}${value ? suffix : ''}</span>`;
  }
  function renderField(field, readOnlyValueHtml) {
    if (!isEditing || !BATCH_DETAIL_EDIT_FIELDS[field]) return readOnlyValueHtml;
    const cfg = BATCH_DETAIL_EDIT_FIELDS[field];
    if (cfg.type === 'checkbox') {
      const checked = batchDetailEditState.draft?.[field] ? 'checked' : '';
      return `<label class="checkbox-field"><input type="checkbox" ${checked} onchange="onBatchDetailDraftChange('${field}', 'checkbox', event)"> Confirmed</label>`;
    }
    return `<div style="min-width:180px;max-width:220px;">${batchDetailEditableValue(field)}</div>`;
  }

  el.innerHTML = `
    <div class="detail-section">
      <h3>Batch Info</h3>
      <div class="detail-row"><span class="detail-label">Batch</span><span class="detail-value">${resolveBatchLabel(batchData)}</span></div>
      <div class="detail-row"><span class="detail-label">Recipe</span><span class="detail-value">${recipe || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">Date</span><span class="detail-value">${f.Date || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">Status</span>${statusBadge(status)}</div>
      ${objType && objType !== 'process_run'
        ? `<div class="detail-row"><span class="detail-label">Object Type</span>${objectTypeTag(objType)}</div>`
        : ''}
    </div>
    ${readinessPanel(f, objType)}
    <button class="btn btn-secondary" onclick="overrideBatchReadiness('${recordId}', '${resolveBatchLabel(batchData).replace(/'/g, "\\'")}')">${!readinessState.ready ? 'Override readiness and proceed' : 'Create readiness review task'}</button>
    <div class="detail-section">
      <h3>Mash</h3>
      <div class="detail-row"><span class="detail-label">Temp</span>${renderField('Mash Temp Actual', compare(log['Mash Temp Actual'], targets.mash))}</div>
      <div class="detail-row"><span class="detail-label">pH</span>${renderField('Mash pH Actual', renderReadOnlyValue(log['Mash pH Actual']))}</div>
      <div class="detail-row"><span class="detail-label">Start Time</span>${renderField('Mash Start Time', renderReadOnlyValue(log['Mash Start Time']))}</div>
    </div>
    <div class="detail-section">
      <h3>Boil</h3>
      <div class="detail-row"><span class="detail-label">Pre-boil Volume</span>${renderField('Pre-boil Volume Actual', compare(log['Pre-boil Volume Actual'], targets.preboil))}</div>
      <div class="detail-row"><span class="detail-label">Pre-boil Gravity</span>${renderField('Pre-boil Gravity Actual', renderReadOnlyValue(log['Pre-boil Gravity Actual']))}</div>
      <div class="detail-row"><span class="detail-label">Boil Confirmed</span>${renderField('Boil Duration Confirmed', renderReadOnlyValue(log['Boil Duration Confirmed'] ? '✓ Yes' : '—'))}</div>
      <div class="detail-row"><span class="detail-label">Hop Notes</span>${renderField('Hop Additions Notes', renderReadOnlyValue(log['Hop Additions Notes']))}</div>
    </div>
    <div class="detail-section">
      <h3>Transfer & Fermentation</h3>
      <div class="detail-row"><span class="detail-label">Transfer Volume</span>${renderField('Transfer Volume Actual', renderReadOnlyValue(log['Transfer Volume Actual'], log['Transfer Volume Actual'] ? ' L' : ''))}</div>
      <div class="detail-row"><span class="detail-label">OG Actual</span>${renderField('OG Actual', compare(log['OG Actual'], targets.og))}</div>
      <div class="detail-row"><span class="detail-label">Transfer Temp</span>${renderField('Transfer Temp Actual', renderReadOnlyValue(log['Transfer Temp Actual'], log['Transfer Temp Actual'] ? ' °C' : ''))}</div>
      <div class="detail-row"><span class="detail-label">Fermenter</span>${renderField('Fermenter ID', renderReadOnlyValue(log['Fermenter ID']))}</div>
      <div class="detail-row"><span class="detail-label">Gravity Checks</span><span class="detail-value">${log['Gravity Checks'] || '—'}</span></div>
      <div class="detail-row"><span class="detail-label">FG Actual</span>${renderField('FG Actual', compare(log['FG Actual'], targets.fg))}</div>
    </div>
    <div class="detail-section">
      <h3>Bottling</h3>
      <div class="detail-row"><span class="detail-label">Bottling Volume</span><span class="detail-value">${log['Bottling Volume Actual'] || '—'} L</span></div>
      <div class="detail-row"><span class="detail-label">Priming Sugar</span><span class="detail-value">${log['Priming Sugar Amount'] || '—'} g</span></div>
      <div class="detail-row"><span class="detail-label">Bottling Date</span><span class="detail-value">${log['Bottling Date'] || '—'}</span></div>
    </div>
    ${log['Brewer Notes'] ? `
    <div class="detail-section">
      <h3>Brewer Notes</h3>
      <p style="font-size:14px;line-height:1.6">${log['Brewer Notes']}</p>
    </div>` : ''}
    ${isEditing
      ? `<button class="btn btn-primary" onclick="saveBatchDetailEdit('${recordId}')">${t('agenda.save')}</button>
         <button class="btn btn-secondary" onclick="cancelBatchDetailEdit('${recordId}')">${t('agenda.cancel')}</button>`
      : `<button class="btn btn-primary" onclick="startBatchDetailEdit('${recordId}')">Edit</button>`
    }
    <button class="btn btn-secondary" onclick="goBackToBatches()">← Back</button>`;
}

