// Maps raw Airtable status values to localized display strings
function displayStatus(raw) {
  if (!raw) return t('status.unknown');
  const key = 'status.' + raw.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  const translated = TRANSLATIONS[currentLang] && TRANSLATIONS[currentLang][key];
  if (translated) return translated;
  const enVal = TRANSLATIONS['en'] && TRANSLATIONS['en'][key];
  return enVal || raw;
}

function pillClassFromPriority(raw) {
  const key = String(raw || '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (key === 'high' || key === 'élevé') return 'indicator-red';
  if (key === 'medium' || key === 'normal') return 'indicator-yellow';
  if (key === 'low' || key === 'faible') return 'indicator-green';
  return 'indicator-neutral';
}

function pillClassFromStatus(raw) {
  const key = String(raw || '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
  if (key === 'blocked') return 'indicator-red';
  if (key === 'in_progress' || key === 'brewing' || key === 'fermenting') return 'indicator-blue';
  if (key === 'done' || key === 'complete' || key === 'completed') return 'indicator-green';
  return 'indicator-neutral';
}

function statusBadge(status) {
  const cls = pillClassFromStatus(status);
  return `<span class="badge indicator-pill ${cls}" aria-label="${displayStatus(status)}"></span>`;
}

function objectTypeTag(type) {
  if (!type || type === 'process_run') return '';
  return `<span class="object-type-tag">${type}</span>`;
}

