function startDemo() {
  showScreen('screen-value');
}

function enterDemo() {
  localStorage.setItem('brewos_demo', '1');
  if (!localStorage.getItem('brewos_role')) {
    localStorage.setItem('brewos_role', 'owner');
  }
  showScreen('screen-home');
}

function bootFlow() {
  refreshStaticTranslations();
  applyTranslations();
  showScreen(getInitialScreen());
}

// ── GUIDANCE HELPER ──────────────────────────────────────────────────────────
function dismissGuidance() {
  const count = parseInt(localStorage.getItem('brewos_guidance_dismissed') || '0') + 1;
  localStorage.setItem('brewos_guidance_dismissed', count);
  const el = document.getElementById('guidance-helper');
  if (el) el.style.display = 'none';
  if (count >= 3) localStorage.setItem('brewos_guidance_hide', '1');
}

function initGuidanceHelper() {
  const hide = localStorage.getItem('brewos_guidance_hide') === '1'
    || !( localStorage.getItem('brewos_show_guidance') !== '0' );
  const el = document.getElementById('guidance-helper');
  if (el && hide) el.style.display = 'none';
}
async function init() {
  bootFlow();
  const batchData = await airtable(TABLES.batches, '?sort[0][field]=Date&sort[0][direction]=desc');
  cachedTaskBatchRecords = batchData.records || [];
  hydrateTaskCreateBatchOptions();
  for (const record of (batchData.records || [])) {
    runTaskSyncSafely(record, '');
  }
  const sel2 = document.getElementById('brew-batch-select');
  sel2.innerHTML = '<option value="">Select a batch...</option>' +
    (batchData.records||[]).map(r =>
      `<option value="${r.id}">${resolveBatchLabel(r)}${Array.isArray(r.fields.Recipe)?` — ${r.fields.Recipe[0]}`:''}</option>`
    ).join('');
  renderHomeBatches(batchData.records || []);
  loadTasks();
  applyHomeLabels();
  initSettings();
  renderFinancialPage();
  switchAgendaView(agendaView);
  initGuidanceHelper();
  renderWhatsNext();
  renderAgendaPreview();
  renderFinancialPreview();
  maybeShowColorTip();
}

init();
