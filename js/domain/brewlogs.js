const STAGES = ['Mash','Boil','Transfer','Ferment','Bottle'];
let currentStage = 0;
let currentLogId = null;
let currentBatchFields = {};
let currentTargets = {};
let currentLogFields = {};

async function loadBrewLog() {
  const batchId = document.getElementById('brew-batch-select').value;
  if (!batchId) return;
  setCurrentRecord('Batches', batchId);
  const batchData = await airtable(TABLES.batches, `/${batchId}`);
  currentBatchFields = batchData.fields;
  const recipe = Array.isArray(currentBatchFields.Recipe) ? currentBatchFields.Recipe[0] : '';
  currentTargets = RECIPE_TARGETS[recipe] || {};
  const logsData = await getBrewLogsForBatch(batchId, currentBatchFields || {});
  currentLogId = logsData.records?.[0]?.id || null;
  currentLogFields = logsData.records?.[0]?.fields || {};
  if (currentLogId) {
    const saved = STAGES.findIndex(s => !isStageComplete(s, currentLogFields));
    currentStage = saved >= 0 ? saved : STAGES.length - 1;
  } else { currentStage = 0; }
  renderBrewStage();
}

function normalizeBatchMatchValue(v) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/^Batch\s*#?\s*/i, '').trim().toLowerCase();
}

function extractBatchMatchCandidates(recordId, batchFields = {}) {
  return new Set([
    recordId,
    batchFields['Declaration Number'],
    batchFields['Batch Number'],
    batchFields['Display Name'],
    batchFields['Name'],
    batchFields['Title']
  ].filter(Boolean).map(normalizeBatchMatchValue));
}

function brewLogMatchesBatch(rec, recordId, batchFields = {}) {
  const f = rec?.fields || {};
  const candidates = extractBatchMatchCandidates(recordId, batchFields);
  const possibleValues = [];

  if (Array.isArray(f['Batch'])) possibleValues.push(...f['Batch']);
  possibleValues.push(
    f['Batch'],
    f['Linked Batch ID'],
    f['Batch ID'],
    f['Batch Number'],
    f['Declaration Number'],
    f['Name'],
    f['Title']
  );

  return possibleValues
    .flatMap(v => Array.isArray(v) ? v : [v])
    .filter(Boolean)
    .map(normalizeBatchMatchValue)
    .some(v => candidates.has(v));
}

async function getBrewLogsForBatch(recordId, batchFields = {}) {
  const byLink = await airtable(TABLES.brewLogs, `?filterByFormula=FIND("${recordId}",ARRAYJOIN({Batch}))`);
  if (byLink.records?.length) return byLink;

  const fallback = await airtable(TABLES.brewLogs, '?maxRecords=100');
  if (!fallback.records?.length) return fallback;

  const matched = fallback.records.find(r => brewLogMatchesBatch(r, recordId, batchFields));
  return { ...fallback, records: matched ? [matched] : [] };
}

function isStageComplete(stage, f) {
  if (stage==='Mash')     return f['Mash Temp Actual'] && f['Mash Start Time'];
  if (stage==='Boil')     return f['Pre-boil Volume Actual'] && f['Boil Duration Confirmed'];
  if (stage==='Transfer') return f['OG Actual'] && f['Transfer Volume Actual'];
  if (stage==='Ferment')  return f['Gravity Checks'];
  if (stage==='Bottle')   return f['FG Actual'] && f['Bottling Volume Actual'];
  return false;
}

function renderBrewStage() {
  const tabs = STAGES.map((s,i) => {
    let cls = i === currentStage ? 'active' : i < currentStage ? 'done' : '';
    return `<div class="stage-tab ${cls}" onclick="currentStage=${i};renderBrewStage()">${s}</div>`;
  }).join('');
  const stage  = STAGES[currentStage];
  const recipe = Array.isArray(currentBatchFields.Recipe) ? currentBatchFields.Recipe[0] : '';
  let fields = '';
  if (stage==='Mash') fields = `
    <div class="field-group"><label class="field-label">Mash Temp Actual (°C)</label>
      ${currentTargets.mash ? `<span class="field-hint">Target: ${currentTargets.mash}°C</span>` : ''}
      <input type="number" id="f-mash-temp" value="${currentLogFields['Mash Temp Actual']||''}" step="0.1" placeholder="e.g. 65.5"></div>
    <div class="field-group"><label class="field-label">Mash pH Actual</label>
      <input type="number" id="f-mash-ph" value="${currentLogFields['Mash pH Actual']||''}" step="0.01" placeholder="e.g. 5.4"></div>
    <div class="field-group"><label class="field-label">Mash Start Time</label>
      <input type="text" id="f-mash-time" value="${currentLogFields['Mash Start Time']||''}" placeholder="e.g. 08:30"></div>`;
  else if (stage==='Boil') fields = `
    <div class="field-group"><label class="field-label">Pre-boil Volume (L)</label>
      ${currentTargets.preboil ? `<span class="field-hint">Target: ${currentTargets.preboil}L</span>` : ''}
      <input type="number" id="f-preboil-vol" value="${currentLogFields['Pre-boil Volume Actual']||''}" step="1"></div>
    <div class="field-group"><label class="field-label">Pre-boil Gravity</label>
      <input type="number" id="f-preboil-grav" value="${currentLogFields['Pre-boil Gravity Actual']||''}" step="0.001"></div>
    <div class="field-group"><label class="checkbox-field">
      <input type="checkbox" id="f-boil-confirmed" ${currentLogFields['Boil Duration Confirmed']?'checked':''}>
      Boil duration confirmed (${currentTargets.boil||60} min)</label></div>
    <div class="field-group"><label class="field-label">Hop Additions Notes</label>
      <textarea id="f-hop-notes">${currentLogFields['Hop Additions Notes']||''}</textarea></div>`;
  else if (stage==='Transfer') fields = `
    <div class="field-group"><label class="field-label">Transfer Volume (L)</label>
      <input type="number" id="f-transfer-vol" value="${currentLogFields['Transfer Volume Actual']||''}" step="1"></div>
    <div class="field-group"><label class="field-label">OG Actual</label>
      ${currentTargets.og ? `<span class="field-hint">Target: ${currentTargets.og}</span>` : ''}
      <input type="number" id="f-og" value="${currentLogFields['OG Actual']||''}" step="0.001"></div>
    <div class="field-group"><label class="field-label">Transfer Temp (°C)</label>
      <input type="number" id="f-transfer-temp" value="${currentLogFields['Transfer Temp Actual']||''}" step="1"></div>
    <div class="field-group"><label class="field-label">Fermenter ID</label>
      <input type="text" id="f-fermenter" value="${currentLogFields['Fermenter ID']||''}"></div>`;
  else if (stage==='Ferment') fields = `
    <div class="field-group"><label class="field-label">Gravity Checks</label>
      <textarea id="f-grav-checks">${currentLogFields['Gravity Checks']||''}</textarea></div>`;
  else if (stage==='Bottle') fields = `
    <div class="field-group"><label class="field-label">FG Actual</label>
      ${currentTargets.fg ? `<span class="field-hint">Target: ${currentTargets.fg}</span>` : ''}
      <input type="number" id="f-fg" value="${currentLogFields['FG Actual']||''}" step="0.001"></div>
    <div class="field-group"><label class="field-label">Bottling Volume (L)</label>
      <input type="number" id="f-bottle-vol" value="${currentLogFields['Bottling Volume Actual']||''}" step="1"></div>
    <div class="field-group"><label class="field-label">Priming Sugar (g)</label>
      <input type="number" id="f-priming" value="${currentLogFields['Priming Sugar Amount']||''}" step="1"></div>
    <div class="field-group"><label class="field-label">Bottling Date</label>
      <input type="text" id="f-bottle-date" value="${currentLogFields['Bottling Date']||''}" placeholder="YYYY-MM-DD"></div>
    <div class="field-group"><label class="field-label">Brewer Notes</label>
      <textarea id="f-notes">${currentLogFields['Brewer Notes']||''}</textarea></div>`;

  document.getElementById('brew-stage-content').innerHTML = `
    <div class="stage-tabs">${tabs}</div>
    <div class="brew-stage">
      <h3>${stage}</h3>
      <p>Recipe: ${recipe || 'Select a batch above'}</p>
      ${fields}
      <button class="btn btn-primary" onclick="saveStage('${stage}')">Save ${stage}</button>
    </div>`;
}

async function saveStage(stage) {
  const batchId = document.getElementById('brew-batch-select').value;
  if (!batchId) { toast('Select a batch first'); return; }
  let fields = {};
  if (stage==='Mash') {
    fields['Mash Temp Actual']    = parseFloat(document.getElementById('f-mash-temp').value)||null;
    fields['Mash pH Actual']      = parseFloat(document.getElementById('f-mash-ph').value)||null;
    fields['Mash Start Time']     = document.getElementById('f-mash-time').value||null;
  } else if (stage==='Boil') {
    fields['Pre-boil Volume Actual']  = parseFloat(document.getElementById('f-preboil-vol').value)||null;
    fields['Pre-boil Gravity Actual'] = parseFloat(document.getElementById('f-preboil-grav').value)||null;
    fields['Boil Duration Confirmed'] = document.getElementById('f-boil-confirmed').checked;
    fields['Hop Additions Notes']     = document.getElementById('f-hop-notes').value||null;
  } else if (stage==='Transfer') {
    fields['Transfer Volume Actual']  = parseFloat(document.getElementById('f-transfer-vol').value)||null;
    fields['OG Actual']               = parseFloat(document.getElementById('f-og').value)||null;
    fields['Transfer Temp Actual']    = parseFloat(document.getElementById('f-transfer-temp').value)||null;
    fields['Fermenter ID']            = document.getElementById('f-fermenter').value||null;
  } else if (stage==='Ferment') {
    fields['Gravity Checks'] = document.getElementById('f-grav-checks').value||null;
  } else if (stage==='Bottle') {
    fields['FG Actual']               = parseFloat(document.getElementById('f-fg').value)||null;
    fields['Bottling Volume Actual']  = parseFloat(document.getElementById('f-bottle-vol').value)||null;
    fields['Priming Sugar Amount']    = parseFloat(document.getElementById('f-priming').value)||null;
    fields['Bottling Date']           = document.getElementById('f-bottle-date').value||null;
    fields['Brewer Notes']            = document.getElementById('f-notes').value||null;
  }
  Object.keys(fields).forEach(k => { if (fields[k]===null||fields[k]==='') delete fields[k]; });
  try {
    if (currentLogId) {
      await airtablePatch(TABLES.brewLogs, currentLogId, fields);
    } else {
      fields['Batch']  = [batchId];
      fields['Log ID'] = `LOG-${batchId.slice(-4)}-${Date.now()}`;
      const data = await airtableCreate(TABLES.brewLogs, fields);
      currentLogId = data.id;
    }
    toast(`✓ ${stage} saved`);
    if (currentStage < STAGES.length-1) currentStage++;
    currentLogFields = { ...currentLogFields, ...fields };
    renderBrewStage();
  } catch(e) { toast('Error saving — check connection'); }
}
