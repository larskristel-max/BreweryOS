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

function applyProductIdentity() {
  const identity = getProductIdentity();
  if (!identity) return;

  document.title = `${identity.name} — ${identity.tagline}`;

  const subtitle = document.getElementById('product-tagline');
  if (subtitle) subtitle.textContent = identity.tagline;

  const entryTitle = document.getElementById('entry-welcome-title');
  if (entryTitle) entryTitle.textContent = PRODUCT_CONFIG.displayStrings.entryTitle;
  const tryDemo = document.getElementById('entry-try-btn');
  if (tryDemo) tryDemo.textContent = PRODUCT_CONFIG.displayStrings.tryDemo;
  const cta = document.getElementById('value-cta-btn');
  if (cta) cta.textContent = PRODUCT_CONFIG.displayStrings.cta;

  const languageBrand = document.getElementById('language-brand-title');
  if (languageBrand) languageBrand.textContent = identity.name;

  const appBrandHeader = document.getElementById('app-brand-header');
  if (appBrandHeader) {
    appBrandHeader.setAttribute('aria-label', identity.name);
  }

  const appBrandSplash = document.getElementById('app-brand-splash');
  if (appBrandSplash) {
    appBrandSplash.setAttribute('aria-label', `${identity.name} ${identity.tagline}`);
  }
}

function bootFlow() {
  applyProductIdentity();
  refreshStaticTranslations();
  applyTranslations();
  startEntryFlow();
}

// ── GUIDANCE HELPER ──────────────────────────────────────────────────────────
function dismissGuidance() {
  const count = parseInt(localStorage.getItem('brewos_guidance_dismissed') || '0') + 1;
  localStorage.setItem('brewos_guidance_dismissed', count);
  if (count >= 3) localStorage.setItem('brewos_guidance_hide', '1');
  syncGuidanceCardsVisibility();
}

function syncGuidanceCardsVisibility() {
  const guidanceEnabled = localStorage.getItem('brewos_show_guidance') !== '0';
  const helperDismissed = localStorage.getItem('brewos_guidance_hide') === '1';
  const colorTipSeen = localStorage.getItem('brewos_color_tip_seen') === '1';

  const helper = document.getElementById('guidance-helper');
  if (helper) helper.style.display = guidanceEnabled && !helperDismissed ? 'flex' : 'none';

  const colorGuide = document.getElementById('home-color-guide');
  if (colorGuide) colorGuide.style.display = guidanceEnabled && !colorTipSeen ? 'flex' : 'none';
}

function initGuidanceHelper() {
  syncGuidanceCardsVisibility();
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
