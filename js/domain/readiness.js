let APP_READINESS_CONDITIONS = SEMANTIC.readinessConditionsFallback;
(async () => {
  APP_READINESS_CONDITIONS = await getReadinessConditions();
})();

const APP_STATE = {
  currentObjectType: null,
  currentRecordId: null,
  currentTableName: null
};

function setCurrentRecord(tableName, recordId) {
  APP_STATE.currentTableName  = tableName;
  APP_STATE.currentRecordId   = recordId;
  APP_STATE.currentObjectType = getObjectType(tableName);
}

function readinessBadge(fields, objectType) {
  if (objectType !== 'process_run') return '';
  const { ready } = SEMANTIC.computeReadiness(fields, {}, APP_READINESS_CONDITIONS);
  return `<span class="badge indicator-pill ${ready ? 'indicator-green' : 'indicator-red'}" aria-label="${ready ? 'ready' : 'blocked'}"></span>`;
}

function readinessPanel(fields, objectType) {
  if (objectType !== 'process_run') return '';
  const { ready, failing } = SEMANTIC.computeReadiness(fields, {}, APP_READINESS_CONDITIONS);
  const cls   = ready ? 'ready' : 'blocked';
  const title = ready ? '✓ Ready for Execution' : '✗ Execution Blocked';
  const rows  = APP_READINESS_CONDITIONS.map(c => {
    const passed = !failing.includes(c.label);
    return `
    <div class="readiness-check">
      <div class="dot ${passed ? 'dot-pass' : 'dot-fail'}">${passed ? '✓' : '✗'}</div>
      <span class="check-label ${passed ? '' : 'fail'}">${c.label}</span>
    </div>`;
  }).join('');
  const explanation = failing.length
    ? `<div class="blocked-reason"><strong>Why blocked:</strong> ${failing.join(', ')}</div>`
    : '';
  return `
    <div class="readiness-panel ${cls}">
      <div class="readiness-title ${cls}">${title}</div>
      <div class="readiness-checks">${rows}</div>
      ${explanation}
    </div>`;
}

function readinessTaskKeyLabel(label = '') {
  return String(label || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}
