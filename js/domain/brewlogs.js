const BREW_SECTIONS = ['Overview', 'Mash', 'Boil', 'Transfer', 'Fermentation', 'Packaging', 'Notes / Exceptions'];
let currentSection = 0;
let currentLogId = null;
let currentBatchId = '';
let currentBatchFields = {};
let currentLogFields = {};
let brewDraftIntake = null;
let currentRecipeContext = null;

const STRUCTURED_IMPORT_EXTENSIONS = new Set(['beerxml', 'xml', 'json', 'csv']);
const INTELLIGENT_IMPORT_EXTENSIONS = new Set(['xlsx', 'xls', 'pdf', 'docx', 'txt', 'png', 'jpg', 'jpeg', 'webp', 'heic']);
const tr = (key, fallback) => {
  const val = t(key);
  return val === key ? fallback : val;
};

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

function isBatchActive(fields = {}) {
  const status = String(sel(fields.Status) || '').toLowerCase();
  if (!status) return false;
  return !['complete', 'completed', 'done', 'archived'].includes(status);
}

async function triggerLetsBrew() {
  openLetsBrewActionHub();
}

function openLetsBrewActionHub() {
  closeLetsBrewActionHub();
  document.body.insertAdjacentHTML('beforeend', `
    <div id="lets-brew-hub-backdrop" class="lets-brew-hub-backdrop" onclick="closeLetsBrewActionHub()"></div>
    <div id="lets-brew-hub-sheet" class="lets-brew-hub-sheet">
      <p class="sheet-title" style="margin-bottom:10px;">${tr('brewhub.title', 'What do you want to do?')}</p>
      <div class="card" style="padding:10px 10px 6px; margin-bottom:10px;">
        <label class="field-label" style="margin-bottom:6px;">${tr('brewhub.ai_zone', 'AI input (coming next)')}</label>
        <div style="display:flex;gap:8px;align-items:center;">
          <input id="lets-brew-ai-input" type="text" placeholder="${tr('brewhub.ai_placeholder', 'What do you want to do?')}" style="margin:0;">
          <button class="action-btn" style="width:44px;height:44px;min-width:44px;" onclick="toast('${tr('brewhub.voice_soon', 'Voice routing coming soon')}')">🎙</button>
        </div>
        <button class="btn btn-secondary" style="margin-top:8px;margin-bottom:0;min-height:42px;" onclick="handleLetsBrewIntentInput()">${tr('brewhub.route_intent', 'Route intent')}</button>
      </div>

      <button class="lets-brew-action-btn primary" onclick="letsBrewStartContinue()">${tr('brewhub.start_continue', 'Start / Continue Brew')}</button>
      <button class="lets-brew-action-btn" onclick="letsBrewQuickLog('gravity')">${tr('brewhub.log_gravity', 'Log observation · gravity')}</button>
      <button class="lets-brew-action-btn" onclick="letsBrewQuickLog('temperature')">${tr('brewhub.log_temperature', 'Log observation · temperature')}</button>
      <button class="lets-brew-action-btn" onclick="letsBrewQuickLog('brew note')">${tr('brewhub.log_brew_note', 'Log observation · brew note')}</button>
      <button class="lets-brew-action-btn" onclick="letsBrewQuickLog('packaging note')">${tr('brewhub.log_packaging_note', 'Log observation · packaging note')}</button>
      <button class="lets-brew-action-btn" onclick="toast('${tr('brewhub.inventory_soon', 'Inventory movement logging coming soon')}')">${tr('brewhub.inventory', 'Log inventory movement')}</button>
      <button class="lets-brew-action-btn" onclick="letsBrewContinueTasks()">${tr('brewhub.continue_tasks', 'Continue open tasks')}</button>
      <button class="lets-brew-action-btn" onclick="letsBrewAddTask()">${tr('brewhub.add_task', 'Add a task')}</button>
      <button class="lets-brew-action-btn" onclick="toast('${tr('brewhub.sale_soon', 'Record sale flow coming soon')}')">${tr('brewhub.sale', 'Record sale')}</button>
      <button class="lets-brew-action-btn" onclick="toast('${tr('brewhub.compliance_soon', 'Compliance / excise / HACCP flow coming soon')}')">${tr('brewhub.compliance', 'Compliance / excise / HACCP')}</button>
      <button class="lets-brew-action-btn" onclick="toast('${tr('brewhub.docs_soon', 'Documents / exports flow coming soon')}')">${tr('brewhub.docs', 'Documents / exports')}</button>
      <button class="btn btn-secondary" style="margin-bottom:0;" onclick="closeLetsBrewActionHub()">${tr('agenda.cancel', 'Close')}</button>
    </div>`);
}

function closeLetsBrewActionHub() {
  document.getElementById('lets-brew-hub-sheet')?.remove();
  document.getElementById('lets-brew-hub-backdrop')?.remove();
}

async function letsBrewStartContinue() {
  closeLetsBrewActionHub();
  showScreen('screen-brew');
  const stageContent = document.getElementById('brew-stage-content');
  stageContent.innerHTML = '<div class="loading"><div class="spinner"></div></div>';

  const batchData = await airtable(TABLES.batches, '?sort[0][field]=Date&sort[0][direction]=desc');
  const allBatches = batchData.records || [];
  const active = allBatches.find(r => isBatchActive(r.fields || {}));

  if (active) {
    await startBrewForBatch(active.id, { skipRecipeGate: false });
    return;
  }
  renderBatchSelectionLayer(allBatches);
}

function letsBrewContinueTasks() {
  closeLetsBrewActionHub();
  openMainTab('screen-tasks');
}

function letsBrewAddTask() {
  closeLetsBrewActionHub();
  openMainTab('screen-tasks');
  setTimeout(() => handleMainTabFab('tasks'), 0);
}

function letsBrewQuickLog(type) {
  closeLetsBrewActionHub();
  toast(`Quick log (${type}) coming soon`);
}

function handleLetsBrewIntentInput() {
  const raw = (document.getElementById('lets-brew-ai-input')?.value || '').trim().toLowerCase();
  if (!raw) {
    toast(tr('brewhub.type_to_route', 'Type a command to route'));
    return;
  }
  if (raw.includes('task')) {
    letsBrewAddTask();
    return;
  }
  if (raw.includes('sale')) {
    toast(tr('brewhub.sale_soon', 'Record sale flow coming soon'));
    return;
  }
  if (raw.includes('brew') || raw.includes('mash') || raw.includes('boil') || raw.includes('gravity')) {
    letsBrewStartContinue();
    return;
  }
  toast(tr('brewhub.no_route', 'Intent router placeholder: no route matched yet'));
}

function getLocalDateInputValue(d = new Date()) {
  const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 10);
}

function renderBatchSelectionLayer(batches = []) {
  const stageContent = document.getElementById('brew-stage-content');
  stageContent.innerHTML = `
    <div class="detail-section">
      <h3>${tr('brewhub.select_batch', 'Select Batch')}</h3>
      <p class="secondary-text" style="margin-bottom:10px;">${tr('brewhub.no_active_batch', 'No active batch was found. Choose an existing batch or create one.')}</p>
      <div style="display:flex;flex-direction:column;gap:8px;">
        ${(batches || []).map(r => {
          const name = resolveBatchLabel(r);
          const recipe = Array.isArray(r.fields?.Recipe) ? r.fields.Recipe[0] : '';
          return `<button class="btn btn-secondary" style="margin-bottom:0;min-height:48px;" onclick="startBrewForBatch('${r.id}')">${name}${recipe ? ` — ${recipe}` : ''}</button>`;
        }).join('') || '<p class="secondary-text">No existing batches.</p>'}
      </div>
      <button class="btn btn-primary" onclick="openCreateBatchSheet()">${tr('brewhub.create_batch', 'Create New Batch')}</button>
    </div>`;
}

function openCreateBatchSheet() {
  closeCreateBatchSheet();
  const stageContent = document.getElementById('brew-stage-content');
  stageContent.insertAdjacentHTML('beforeend', `
    <div id="lets-brew-batch-sheet" class="card" style="position:fixed;left:12px;right:12px;bottom:calc(env(safe-area-inset-bottom) + 12px);z-index:1300;padding:14px;border-radius:16px;box-shadow:0 12px 26px rgba(17,24,39,0.16);">
      <p class="sheet-title">Create Batch</p>
      <div class="field-group"><label class="field-label">Batch Name</label><input id="lets-brew-batch-name" type="text" placeholder="e.g. Spring Lager"></div>
      <div class="field-group"><label class="field-label">Brew Date</label><input id="lets-brew-batch-date" type="text" placeholder="YYYY-MM-DD" value="${getLocalDateInputValue()}"></div>
      <button class="btn btn-primary" onclick="createBatchForLetsBrew()">Create and Continue</button>
      <button class="btn btn-secondary" onclick="closeCreateBatchSheet()">Cancel</button>
    </div>`);
}

function closeCreateBatchSheet() {
  document.getElementById('lets-brew-batch-sheet')?.remove();
}

async function createBatchForLetsBrew() {
  const displayName = (document.getElementById('lets-brew-batch-name')?.value || '').trim();
  if (!displayName) {
    toast('Batch name is required');
    return;
  }
  const brewDate = (document.getElementById('lets-brew-batch-date')?.value || '').trim();
  const fields = { 'Display Name': displayName, 'Status': 'Brewing' };
  if (brewDate) fields['Date'] = brewDate;
  const created = await airtableCreate(TABLES.batches, fields);
  closeCreateBatchSheet();
  toast('Batch created');
  await startBrewForBatch(created.id, { skipRecipeGate: false });
}

async function startBrewForBatch(batchId, opts = {}) {
  if (!batchId) return;
  currentBatchId = batchId;
  setCurrentRecord('Batches', batchId);
  const batchData = await airtable(TABLES.batches, `/${batchId}`);
  currentBatchFields = batchData.fields || {};

  const recipeId = Array.isArray(currentBatchFields.Recipe) ? currentBatchFields.Recipe[0] : '';
  currentRecipeContext = recipeId ? await loadRecipeContext(recipeId) : null;

  if (!recipeId && !opts.skipRecipeGate) {
    renderNoRecipeBranching();
    return;
  }

  const logsData = await getBrewLogsForBatch(batchId, currentBatchFields || {});
  currentLogId = logsData.records?.[0]?.id || null;
  currentLogFields = logsData.records?.[0]?.fields || {};
  currentSection = currentLogId
    ? Math.max(0, BREW_SECTIONS.findIndex((s) => !isSectionComplete(s, currentLogFields)))
    : 0;
  if (currentSection < 0) currentSection = 0;

  renderBrewExecution();
}

async function loadRecipeContext(recipeId) {
  try {
    const recipe = await airtable(TABLES.recipes, `/${recipeId}`);
    return recipe?.fields || null;
  } catch (e) {
    return null;
  }
}

function renderNoRecipeBranching() {
  const stageContent = document.getElementById('brew-stage-content');
  stageContent.innerHTML = `
    <div class="detail-section">
      <h3>No recipe linked yet</h3>
      <p class="secondary-text" style="margin-bottom:12px;">What do you want to do?</p>
      <button class="btn btn-primary" onclick="openRecipeCreateFlow()">Create one</button>
      <button class="btn btn-secondary" onclick="openRecipeUploadFlow()">Upload a recipe</button>
      <button class="btn btn-secondary" onclick="continueWithoutRecipe()">Continue without one</button>
    </div>`;
}

function openRecipeCreateFlow() {
  const stageContent = document.getElementById('brew-stage-content');
  stageContent.innerHTML = `
    <div class="detail-section">
      <h3>Create Recipe</h3>
      <p class="secondary-text" style="margin-bottom:10px;">Lightweight draft: structure + free text (AI-ready).</p>
      <div class="field-group"><label class="field-label">Recipe Name</label><input id="new-recipe-name" type="text" placeholder="e.g. House Pale Ale"></div>
      <div class="field-group"><label class="field-label">Recipe Notes</label><textarea id="new-recipe-free-text" placeholder="same as last time, lightly hazy, dry hop day 3..."></textarea></div>
      <button class="btn btn-primary" onclick="createAndLinkRecipeFromForm()">Save and Continue</button>
      <button class="btn btn-secondary" onclick="renderNoRecipeBranching()">Back</button>
    </div>`;
}

async function createAndLinkRecipeFromForm() {
  const name = (document.getElementById('new-recipe-name')?.value || '').trim();
  if (!name) {
    toast('Recipe name is required');
    return;
  }
  const notes = (document.getElementById('new-recipe-free-text')?.value || '').trim();

  const recipePayload = {
    'Name': name,
    'Notes': notes || null
  };
  Object.keys(recipePayload).forEach((k) => recipePayload[k] == null && delete recipePayload[k]);
  const recipe = await airtableCreate(TABLES.recipes, recipePayload);
  await airtablePatch(TABLES.batches, currentBatchId, { Recipe: [recipe.id] });

  toast('Recipe linked');
  await startBrewForBatch(currentBatchId, { skipRecipeGate: true });
}

function openRecipeUploadFlow() {
  brewDraftIntake = null;
  const stageContent = document.getElementById('brew-stage-content');
  stageContent.innerHTML = `
    <div class="detail-section">
      <h3>Recipe Intake</h3>
      <p class="secondary-text" style="margin-bottom:10px;">Supports structured import + intelligent extraction. Parsing is non-blocking.</p>
      <div class="field-group">
        <label class="field-label">Upload file</label>
        <input id="recipe-upload-file" type="file" accept=".beerxml,.xml,.json,.csv,.xlsx,.xls,.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp,.heic">
      </div>
      <div class="field-group"><label class="field-label">Paste text</label><textarea id="recipe-upload-text" placeholder="Paste recipe, brew notes, or mixed context..."></textarea></div>
      <div class="field-group"><label class="field-label">Speech transcript</label><textarea id="recipe-upload-speech" placeholder="Paste dictated transcript..."></textarea></div>
      <button class="btn btn-primary" onclick="prepareIntakeDraft()">Analyze Input</button>
      <button class="btn btn-secondary" onclick="continueWithoutRecipe()">Continue without recipe</button>
      <button class="btn btn-secondary" onclick="renderNoRecipeBranching()">Back</button>
      <div id="intake-preview" style="margin-top:12px;"></div>
    </div>`;
}

function detectIntakeLane(fileName = '', hasText = false) {
  const ext = fileName.includes('.') ? fileName.split('.').pop().toLowerCase() : '';
  if (STRUCTURED_IMPORT_EXTENSIONS.has(ext)) return 'structured';
  if (INTELLIGENT_IMPORT_EXTENSIONS.has(ext)) return 'intelligent';
  return hasText ? 'intelligent' : 'unknown';
}

function detectIntakeType(rawText = '') {
  const lc = rawText.toLowerCase();
  const recipeSignals = ['mash', 'boil', 'ibu', 'og', 'fg', 'yeast', 'grain'];
  const logSignals = ['actual', 'measured', 'observed', 'deviation', 'started'];
  const recipeHits = recipeSignals.filter(s => lc.includes(s)).length;
  const logHits = logSignals.filter(s => lc.includes(s)).length;
  if (recipeHits && logHits) return 'mixed';
  if (recipeHits) return 'recipe plan';
  if (logHits) return 'brew log';
  return lc.trim() ? 'ambiguous' : 'ambiguous';
}

function extractIntakeStructure(rawText = '') {
  const lc = rawText.toLowerCase();
  const include = (token) => lc.includes(token);
  return {
    ingredients: include('malt') || include('hop') || include('yeast'),
    mashSteps: include('mash'),
    boilAdditions: include('boil') || include('hop'),
    yeast: include('yeast'),
    targets: include('og') || include('fg') || include('ibu'),
    volumes: include('liter') || include('l '),
    packaging: include('package') || include('bottle') || include('keg')
  };
}

function routeTargetsByType(detectedType) {
  if (detectedType === 'recipe plan') return ['Recipes', 'Recipe Mash Steps', 'Recipe Boil Additions'];
  if (detectedType === 'brew log') return ['Brew Logs', 'Mash Steps', 'Boil Additions', 'Fermentation Checks'];
  if (detectedType === 'mixed') return ['Recipes', 'Recipe Mash Steps', 'Recipe Boil Additions', 'Brew Logs', 'Mash Steps', 'Boil Additions', 'Fermentation Checks'];
  return ['Needs user confirmation before routing'];
}

function computeConfidence(lane, type) {
  if (lane === 'structured') return type === 'ambiguous' ? 0.68 : 0.92;
  if (lane === 'intelligent') return type === 'ambiguous' ? 0.41 : 0.64;
  return 0.2;
}

function renderIntakePreview() {
  const holder = document.getElementById('intake-preview');
  if (!holder || !brewDraftIntake) return;
  const shape = brewDraftIntake.structure;
  const uncertain = brewDraftIntake.type === 'ambiguous' || brewDraftIntake.confidence < 0.7;
  holder.innerHTML = `
    <div class="card" style="padding:12px;">
      <p class="text-section">AI Intake Draft</p>
      <p class="secondary-text">Lane: <strong>${brewDraftIntake.lane}</strong> · Type: <strong>${brewDraftIntake.type}</strong> · Confidence: <strong>${Math.round(brewDraftIntake.confidence * 100)}%</strong></p>
      <p class="secondary-text">Detected structure: ${Object.entries(shape).filter(([, v]) => v).map(([k]) => k).join(', ') || 'none yet'}</p>
      <p class="secondary-text">Routing targets: ${brewDraftIntake.routing.join(', ')}</p>
      ${uncertain ? '<p class="secondary-text" style="color:#b45309;">Ambiguity detected. Confirmation required before final mapping.</p>' : '<p class="secondary-text">Strong structure detected. Minimal confirmation expected.</p>'}
      <button class="btn btn-primary" onclick="confirmIntakeAndLinkRecipe()">Confirm & Link Recipe</button>
    </div>`;
}

function prepareIntakeDraft() {
  const fileInput = document.getElementById('recipe-upload-file');
  const file = fileInput?.files?.[0] || null;
  const text = (document.getElementById('recipe-upload-text')?.value || '').trim();
  const speech = (document.getElementById('recipe-upload-speech')?.value || '').trim();
  const mergedText = [text, speech].filter(Boolean).join('\n');
  const lane = detectIntakeLane(file?.name || '', !!mergedText);
  const type = detectIntakeType(`${file?.name || ''} ${mergedText}`);
  const structure = extractIntakeStructure(mergedText);

  brewDraftIntake = {
    lane,
    type,
    structure,
    routing: routeTargetsByType(type),
    confidence: computeConfidence(lane, type),
    rawText: mergedText,
    fileName: file?.name || ''
  };
  renderIntakePreview();
}

async function confirmIntakeAndLinkRecipe() {
  if (!brewDraftIntake) {
    toast('Analyze input first');
    return;
  }

  const recipeName = (prompt('Recipe name for imported intake', `Imported Recipe ${getLocalDateInputValue()}`) || '').trim();
  if (!recipeName) {
    toast('Recipe not created');
    return;
  }

  const intakeSummary = `source=${brewDraftIntake.fileName || 'manual-input'}; lane=${brewDraftIntake.lane}; type=${brewDraftIntake.type}; confidence=${Math.round(brewDraftIntake.confidence * 100)}%`;
  const recipe = await airtableCreate(TABLES.recipes, { Name: recipeName, Notes: `${intakeSummary}\n\n${brewDraftIntake.rawText || ''}`.trim() });

  await airtablePatch(TABLES.batches, currentBatchId, { Recipe: [recipe.id] });
  toast('Recipe imported and linked');
  await startBrewForBatch(currentBatchId, { skipRecipeGate: true });
}

async function continueWithoutRecipe() {
  toast('Continuing without recipe');
  await startBrewForBatch(currentBatchId, { skipRecipeGate: true });
}

function isSectionComplete(section, f) {
  if (section === 'Overview') return true;
  if (section === 'Mash') return !!(f['Mash Temp Actual'] || f['Mash Start Time']);
  if (section === 'Boil') return !!(f['Pre-boil Volume Actual'] || f['Boil Duration Confirmed']);
  if (section === 'Transfer') return !!(f['OG Actual'] || f['Transfer Volume Actual']);
  if (section === 'Fermentation') return !!f['Gravity Checks'];
  if (section === 'Packaging') return !!(f['FG Actual'] || f['Bottling Volume Actual']);
  if (section === 'Notes / Exceptions') return !!f['Brewer Notes'];
  return false;
}

function renderBrewExecution() {
  const tabs = BREW_SECTIONS.map((s, i) => {
    const cls = i === currentSection ? 'active' : (isSectionComplete(s, currentLogFields) ? 'done' : '');
    return `<div class="stage-tab ${cls}" onclick="currentSection=${i};renderBrewExecution()">${s}</div>`;
  }).join('');

  const section = BREW_SECTIONS[currentSection];
  const recipe = Array.isArray(currentBatchFields.Recipe) ? currentBatchFields.Recipe[0] : '';
  const batchLabel = resolveBatchLabel({ id: currentBatchId, fields: currentBatchFields });

  let fields = '';
  if (section === 'Overview') {
    fields = `
      <p class="secondary-text">Start with any section below. Brewing remains non-blocking even when recipe or measurements are incomplete.</p>
      <p class="secondary-text">Recipe context loaded from Airtable: <strong>${currentRecipeContext?.Name || 'Not linked'}</strong>.</p>`;
  } else if (section === 'Mash') {
    fields = `
      <div class="field-group"><label class="field-label">Mash Temp Actual (°C)</label><input type="number" id="f-mash-temp" value="${currentLogFields['Mash Temp Actual'] || ''}" step="0.1"></div>
      <div class="field-group"><label class="field-label">Mash pH Actual</label><input type="number" id="f-mash-ph" value="${currentLogFields['Mash pH Actual'] || ''}" step="0.01"></div>
      <div class="field-group"><label class="field-label">Mash Start Time</label><input type="text" id="f-mash-time" value="${currentLogFields['Mash Start Time'] || ''}" placeholder="08:30"></div>
      <div class="field-group"><label class="field-label">Mash Step Note</label><input type="text" id="f-mash-step-note" placeholder="Optional step observation"></div>
      <button class="btn btn-secondary" onclick="addMashStepActual()">Record Mash Step Actual</button>`;
  } else if (section === 'Boil') {
    fields = `
      <div class="field-group"><label class="field-label">Pre-boil Volume (L)</label><input type="number" id="f-preboil-vol" value="${currentLogFields['Pre-boil Volume Actual'] || ''}" step="1"></div>
      <div class="field-group"><label class="field-label">Pre-boil Gravity</label><input type="number" id="f-preboil-grav" value="${currentLogFields['Pre-boil Gravity Actual'] || ''}" step="0.001"></div>
      <div class="field-group"><label class="checkbox-field"><input type="checkbox" id="f-boil-confirmed" ${currentLogFields['Boil Duration Confirmed'] ? 'checked' : ''}>Boil duration confirmed</label></div>
      <div class="field-group"><label class="field-label">Hop Additions Notes</label><textarea id="f-hop-notes">${currentLogFields['Hop Additions Notes'] || ''}</textarea></div>
      <div class="field-group"><label class="field-label">Boil Addition Note</label><input id="f-boil-addition-note" type="text" placeholder="Optional addition detail"></div>
      <button class="btn btn-secondary" onclick="addBoilAdditionActual()">Record Boil Addition Actual</button>`;
  } else if (section === 'Transfer') {
    fields = `
      <div class="field-group"><label class="field-label">Transfer Volume (L)</label><input type="number" id="f-transfer-vol" value="${currentLogFields['Transfer Volume Actual'] || ''}" step="1"></div>
      <div class="field-group"><label class="field-label">OG Actual</label><input type="number" id="f-og" value="${currentLogFields['OG Actual'] || ''}" step="0.001"></div>
      <div class="field-group"><label class="field-label">Transfer Temp (°C)</label><input type="number" id="f-transfer-temp" value="${currentLogFields['Transfer Temp Actual'] || ''}" step="1"></div>
      <div class="field-group"><label class="field-label">Fermenter ID</label><input type="text" id="f-fermenter" value="${currentLogFields['Fermenter ID'] || ''}"></div>`;
  } else if (section === 'Fermentation') {
    fields = `
      <div class="field-group"><label class="field-label">Gravity Checks</label><textarea id="f-grav-checks">${currentLogFields['Gravity Checks'] || ''}</textarea></div>
      <div class="field-group"><label class="field-label">Fermentation Check Note</label><input id="f-fermentation-note" type="text" placeholder="Optional fermentation check"></div>
      <button class="btn btn-secondary" onclick="addFermentationCheckActual()">Record Fermentation Check</button>`;
  } else if (section === 'Packaging') {
    fields = `
      <div class="field-group"><label class="field-label">FG Actual</label><input type="number" id="f-fg" value="${currentLogFields['FG Actual'] || ''}" step="0.001"></div>
      <div class="field-group"><label class="field-label">Packaging Volume (L)</label><input type="number" id="f-bottle-vol" value="${currentLogFields['Bottling Volume Actual'] || ''}" step="1"></div>
      <div class="field-group"><label class="field-label">Priming Sugar (g)</label><input type="number" id="f-priming" value="${currentLogFields['Priming Sugar Amount'] || ''}" step="1"></div>
      <div class="field-group"><label class="field-label">Packaging Date</label><input type="text" id="f-bottle-date" value="${currentLogFields['Bottling Date'] || ''}" placeholder="YYYY-MM-DD"></div>`;
  } else {
    fields = `
      <div class="field-group"><label class="field-label">Brewer Notes</label><textarea id="f-notes">${currentLogFields['Brewer Notes'] || ''}</textarea></div>`;
  }

  document.getElementById('brew-stage-content').innerHTML = `
    <div class="detail-section">
      <h3>Brew Execution</h3>
      <p class="secondary-text">Batch: <strong>${batchLabel}</strong></p>
      <p class="secondary-text">Recipe context: <strong>${recipe || 'none linked'}</strong> (suggestions only)</p>
    </div>
    <div class="stage-tabs">${tabs}</div>
    <div class="brew-stage">
      <h3>${section}</h3>
      <p>All sections are optional. Save partials anytime and return later.</p>
      ${fields}
      <button class="btn btn-primary" onclick="saveSection('${section}')">Save ${section}</button>
    </div>`;
}

async function ensureBrewLogForActuals() {
  if (currentLogId) return currentLogId;
  const data = await airtableCreate(TABLES.brewLogs, {
    Batch: [currentBatchId],
    'Log ID': `LOG-${currentBatchId.slice(-4)}-${Date.now()}`
  });
  currentLogId = data.id;
  return currentLogId;
}

async function saveSection(section) {
  if (!currentBatchId) {
    toast('Select a batch first');
    return;
  }

  const fields = {};
  if (section === 'Mash') {
    fields['Mash Temp Actual'] = parseFloat(document.getElementById('f-mash-temp')?.value) || null;
    fields['Mash pH Actual'] = parseFloat(document.getElementById('f-mash-ph')?.value) || null;
    fields['Mash Start Time'] = document.getElementById('f-mash-time')?.value || null;
  } else if (section === 'Boil') {
    fields['Pre-boil Volume Actual'] = parseFloat(document.getElementById('f-preboil-vol')?.value) || null;
    fields['Pre-boil Gravity Actual'] = parseFloat(document.getElementById('f-preboil-grav')?.value) || null;
    fields['Boil Duration Confirmed'] = !!document.getElementById('f-boil-confirmed')?.checked;
    fields['Hop Additions Notes'] = document.getElementById('f-hop-notes')?.value || null;
  } else if (section === 'Transfer') {
    fields['Transfer Volume Actual'] = parseFloat(document.getElementById('f-transfer-vol')?.value) || null;
    fields['OG Actual'] = parseFloat(document.getElementById('f-og')?.value) || null;
    fields['Transfer Temp Actual'] = parseFloat(document.getElementById('f-transfer-temp')?.value) || null;
    fields['Fermenter ID'] = document.getElementById('f-fermenter')?.value || null;
  } else if (section === 'Fermentation') {
    fields['Gravity Checks'] = document.getElementById('f-grav-checks')?.value || null;
  } else if (section === 'Packaging') {
    fields['FG Actual'] = parseFloat(document.getElementById('f-fg')?.value) || null;
    fields['Bottling Volume Actual'] = parseFloat(document.getElementById('f-bottle-vol')?.value) || null;
    fields['Priming Sugar Amount'] = parseFloat(document.getElementById('f-priming')?.value) || null;
    fields['Bottling Date'] = document.getElementById('f-bottle-date')?.value || null;
  } else {
    fields['Brewer Notes'] = document.getElementById('f-notes')?.value || null;
  }

  Object.keys(fields).forEach((k) => (fields[k] === null || fields[k] === '') && delete fields[k]);
  if (!Object.keys(fields).length) {
    toast('No data to save yet');
    return;
  }

  try {
    const logId = await ensureBrewLogForActuals();
    await airtablePatch(TABLES.brewLogs, logId, fields);
    currentLogFields = { ...currentLogFields, ...fields };
    toast(`✓ ${section} saved`);
    if (currentSection < BREW_SECTIONS.length - 1) currentSection += 1;
    renderBrewExecution();
  } catch (e) {
    toast('Error saving — check connection');
  }
}

async function addMashStepActual() {
  const note = (document.getElementById('f-mash-step-note')?.value || '').trim();
  if (!note) {
    toast('Enter mash step note first');
    return;
  }
  try {
    const logId = await ensureBrewLogForActuals();
    await createChildActualRecord(TABLES.mashSteps, logId, note, {
      linkCandidates: ['Brew Log', 'Brew Logs', 'Brew Log ID', 'Log'],
      noteCandidates: ['Notes']
    });
    document.getElementById('f-mash-step-note').value = '';
    toast('Mash step recorded');
  } catch (e) {
    toast('Could not add mash step');
  }
}

async function addBoilAdditionActual() {
  const note = (document.getElementById('f-boil-addition-note')?.value || '').trim();
  if (!note) {
    toast('Enter boil addition note first');
    return;
  }
  try {
    const logId = await ensureBrewLogForActuals();
    await createChildActualRecord(TABLES.boilAdditions, logId, note, {
      linkCandidates: ['Brew Log', 'Brew Logs', 'Brew Log ID', 'Log'],
      noteCandidates: ['Notes']
    });
    document.getElementById('f-boil-addition-note').value = '';
    toast('Boil addition recorded');
  } catch (e) {
    toast('Could not add boil addition');
  }
}

async function addFermentationCheckActual() {
  const note = (document.getElementById('f-fermentation-note')?.value || '').trim();
  if (!note) {
    toast('Enter fermentation note first');
    return;
  }
  try {
    const logId = await ensureBrewLogForActuals();
    await createChildActualRecord(TABLES.fermentationChecks, logId, note, {
      linkCandidates: ['Brew Log', 'Brew Logs', 'Brew Log ID', 'Log'],
      noteCandidates: ['Notes', 'Check Notes', 'Observation']
    });
    document.getElementById('f-fermentation-note').value = '';
    toast('Fermentation check recorded');
  } catch (e) {
    toast('Could not add fermentation check');
  }
}

const tableFieldCache = {};

async function resolveTableFieldName(table, candidates = [], fallback = '') {
  const cacheKey = `${table}:${candidates.join('|')}:${fallback}`;
  if (tableFieldCache[cacheKey]) return tableFieldCache[cacheKey];
  try {
    const sample = await airtable(table, '?maxRecords=1');
    const keys = Object.keys(sample?.records?.[0]?.fields || {});
    const found = candidates.find((c) => keys.includes(c));
    tableFieldCache[cacheKey] = found || fallback;
    return tableFieldCache[cacheKey];
  } catch (e) {
    tableFieldCache[cacheKey] = fallback;
    return fallback;
  }
}

async function createChildActualRecord(table, brewLogId, note, options = {}) {
  const linkField = await resolveTableFieldName(table, options.linkCandidates || [], (options.linkCandidates || [])[0] || 'Brew Log');
  const noteField = await resolveTableFieldName(table, options.noteCandidates || [], (options.noteCandidates || [])[0] || 'Notes');
  await airtableCreate(table, {
    [linkField]: [brewLogId],
    [noteField]: note
  });
}
