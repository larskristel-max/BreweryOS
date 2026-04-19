// Normalize any Airtable value to a plain number (handles objects, arrays, strings)
function toNum(v) {
  if (typeof v === 'number') return isFinite(v) ? v : 0;
  if (Array.isArray(v)) return toNum(v[0]);
  if (v && typeof v === 'object') {
    if ('value' in v) return toNum(v.value);
    if ('number' in v) return toNum(v.number);
    if ('amount' in v) return toNum(v.amount);
  }
  if (typeof v === 'string') return parseFloat(v.replace(/[^0-9.-]/g, '')) || 0;
  return 0;
}

async function fetchFinancialSnapshot(periodType) {
  const fields = [
    'Period Label','Date','Period Type','Revenue','Costs','Margin',
    'Previous Period Revenue','Previous Period Costs','Previous Period Margin',
    'VAT Reserve Estimate','Excise Reserve Estimate','Tax Reserve Estimate',
    'Total Reserve Estimate','Safe To Spend'
  ].map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  const formula = encodeURIComponent(`{Period Type}='${periodType}'`);
  const data = await airtable('tbltrrs047wZJv0SB', `?${fields}&filterByFormula=${formula}&maxRecords=5&sort[0][field]=Date&sort[0][direction]=desc`);
  if (data.error) throw new Error(`Financial snapshot ${data.error.type || 'error'}`);

  function sel(v) { return (v && typeof v==='object' && v.name) ? v.name : (v||''); }

  return (data.records || []).map(rec => {
    const f = rec.fields || rec.cellValuesByFieldId || {};
    const g = n => f[n] ?? null;
    return {
      periodLabel:   g('Period Label') || '',
      date:          g('Date') || '',
      periodType:    sel(g('Period Type')),
      revenue:       toNum(g('Revenue')),
      costs:         toNum(g('Costs')),
      margin:        toNum(g('Margin')),
      prevRevenue:   g('Previous Period Revenue') != null ? toNum(g('Previous Period Revenue')) : null,
      prevCosts:     g('Previous Period Costs')   != null ? toNum(g('Previous Period Costs'))   : null,
      prevMargin:    g('Previous Period Margin')  != null ? toNum(g('Previous Period Margin'))  : null,
      vatReserve:    toNum(g('VAT Reserve Estimate')),
      exciseReserve: toNum(g('Excise Reserve Estimate')),
      taxReserve:    toNum(g('Tax Reserve Estimate')),
      totalReserve:  toNum(g('Total Reserve Estimate')),
      safeToSpend:   toNum(g('Safe To Spend')),
    };
  });
}

async function fetchCostBreakdown() {
  const fields = ['Description','Cost Category','Amount','Date','Linked Batch ID']
    .map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  const data = await airtable('tblVpdYdza5mWgT0K', `?${fields}&maxRecords=50&sort[0][field]=Date&sort[0][direction]=desc`);
  if (data.error) throw new Error(`Cost breakdown ${data.error.type || 'error'}`);

  function sel(v) { return (v && typeof v==='object' && v.name) ? v.name : (v||''); }

  return (data.records || []).map(rec => {
    const f = rec.fields || rec.cellValuesByFieldId || {};
    return {
      id:          rec.id,
      description: f['Description'] || '—',
      category:    sel(f['Cost Category']) || 'Other',
      amount:      f['Amount'] || 0,
      date:        f['Date'] || '',
      batchId:     f['Linked Batch ID'] || '',
    };
  });
}

async function fetchObligations() {
  const fields = ['Title','Type','Due Date','Status','Notes']
    .map(f => `fields[]=${encodeURIComponent(f)}`).join('&');

  const data = await airtable('tblL6qs7uKCUJA10L', `?${fields}&maxRecords=20&sort[0][field]=Due Date&sort[0][direction]=asc`);
  if (data.error) throw new Error(`Obligations ${data.error.type || 'error'}`);

  function sel(v) { return (v && typeof v==='object' && v.name) ? v.name : (v||''); }

  return (data.records || []).map(rec => {
    const f = rec.fields || rec.cellValuesByFieldId || {};
    return {
      id:      rec.id,
      title:   f['Title'] || '—',
      type:    sel(f['Type']) || '',
      dueDate: f['Due Date'] || '',
      status:  sel(f['Status']) || 'upcoming',
      notes:   f['Notes'] || '',
    };
  });
}

async function loadFinancialFromAirtable() {
  const periodType = window._financialPeriod
    || (typeof financialPeriod !== 'undefined' ? financialPeriod : 'month');

  const periodMap = { today: 'day', week: 'week', month: 'month' };
  const atPeriod  = periodMap[periodType] || 'month';

  try {
    const [snapshots, costs, obligations] = await Promise.all([
      fetchFinancialSnapshot(atPeriod),
      fetchCostBreakdown(),
      fetchObligations(),
    ]);

    window._financialCache = { snapshots, costs, obligations, periodType: atPeriod };
    renderFinancialFromCache();
  } catch (err) {
    console.error('[Financial] fetch failed', err);
  }
}

function renderFinancialFromCache() {
  const cache = window._financialCache;
  if (!cache) return;

  const snap = cache.snapshots[0] || null;
  const costs = cache.costs;
  const obligations = cache.obligations;

  const stsEl = document.getElementById('financial-safe-to-spend')
    || document.querySelector('.financial-safe-to-spend .amount')
    || document.querySelector('[data-financial="safe-to-spend"]');
  if (stsEl && snap) stsEl.textContent = `€${snap.safeToSpend.toLocaleString('fr-BE')}`;

  const revEl = document.getElementById('financial-revenue')
    || document.querySelector('[data-financial="revenue"]');
  if (revEl && snap) revEl.textContent = `€${snap.revenue.toLocaleString('fr-BE')}`;

  const costsEl = document.getElementById('financial-costs')
    || document.querySelector('[data-financial="costs"]');
  if (costsEl && snap) costsEl.textContent = `€${snap.costs.toLocaleString('fr-BE')}`;

  const marginEl = document.getElementById('financial-margin')
    || document.querySelector('[data-financial="margin"]');
  if (marginEl && snap) marginEl.textContent = `€${snap.margin.toLocaleString('fr-BE')}`;

  const vatEl    = document.getElementById('financial-vat-reserve')    || document.querySelector('[data-financial="vat-reserve"]');
  const exciseEl = document.getElementById('financial-excise-reserve') || document.querySelector('[data-financial="excise-reserve"]');
  const taxEl    = document.getElementById('financial-tax-reserve')    || document.querySelector('[data-financial="tax-reserve"]');
  const totalEl  = document.getElementById('financial-total-reserve')  || document.querySelector('[data-financial="total-reserve"]');
  if (snap) {
    if (vatEl)    vatEl.textContent    = `€${snap.vatReserve.toLocaleString('fr-BE')}`;
    if (exciseEl) exciseEl.textContent = `€${snap.exciseReserve.toLocaleString('fr-BE')}`;
    if (taxEl)    taxEl.textContent    = `€${snap.taxReserve.toLocaleString('fr-BE')}`;
    if (totalEl)  totalEl.textContent  = `€${snap.totalReserve.toLocaleString('fr-BE')}`;
  }

  if (!snap) {
    const noDataEl = document.getElementById('financial-no-data')
      || document.querySelector('.financial-empty');
    if (noDataEl) noDataEl.style.display = 'block';
  }

  const costListEl = document.getElementById('financial-cost-list')
    || document.querySelector('.financial-cost-breakdown')
    || document.querySelector('[data-financial="cost-list"]');

  if (costListEl) {
    if (costs.length === 0) {
      costListEl.innerHTML = `<div style="color:#9e9e9e;font-size:13px;padding:8px 0;">No cost entries recorded yet.</div>`;
    } else {
      const maxAmt = Math.max(...costs.map(c => c.amount), 1);
      costListEl.innerHTML = costs.map(c => `
        <div style="margin-bottom:10px;">
          <div style="display:flex;justify-content:space-between;font-size:13px;color:#212121;margin-bottom:3px;">
            <span>${c.description}</span>
            <span style="font-weight:500;">€${c.amount.toLocaleString('fr-BE')}</span>
          </div>
          <div style="background:#f0f0f0;border-radius:4px;height:5px;overflow:hidden;">
            <div style="background:#1565c0;height:100%;width:${Math.round((c.amount/maxAmt)*100)}%;border-radius:4px;"></div>
          </div>
          <div style="font-size:11px;color:#9e9e9e;margin-top:2px;">${c.category}${c.batchId ? ' · Batch '+c.batchId : ''}</div>
        </div>`).join('');
    }
  }

  const oblListEl = document.getElementById('financial-obligations')
    || document.querySelector('.financial-obligations')
    || document.querySelector('[data-financial="obligations"]');

  if (oblListEl) {
    const statusColor = { upcoming: '#f57f17', overdue: '#d32f2f', done: '#2e7d32', paid: '#2e7d32' };
    const today = new Date(); today.setHours(0,0,0,0);

    oblListEl.innerHTML = obligations.map(o => {
      const color = statusColor[o.status] || '#9e9e9e';
      let dueLabel = '';
      if (o.dueDate) {
        const due  = new Date(o.dueDate); due.setHours(0,0,0,0);
        const diff = Math.round((due - today) / 86400000);
        if (diff < 0)        dueLabel = `<span style="color:#d32f2f;">${t('due.overdue').replace('%d', Math.abs(diff))}</span>`;
        else if (diff === 0) dueLabel = `<span style="color:#f57f17;">${t('due.today')}</span>`;
        else                 dueLabel = `<span style="color:#757575;">${o.dueDate}</span>`;
      }
      return `
        <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid #f0f0f0;">
          <div>
            <div style="font-size:13px;font-weight:500;color:#212121;">${o.title}</div>
            <div style="font-size:11px;margin-top:2px;">${dueLabel}</div>
            ${o.notes ? `<div style="font-size:11px;color:#9e9e9e;margin-top:2px;">${o.notes}</div>` : ''}
          </div>
          <span style="font-size:11px;font-weight:600;color:${color};text-transform:uppercase;letter-spacing:0.3px;">${o.status}</span>
        </div>`;
    }).join('') || `<div style="color:#9e9e9e;font-size:13px;padding:8px 0;">No obligations recorded.</div>`;
  }
}

const FINANCIAL_DEMO = {
  revenue: 6480, costs: 3240, margin: 3240,
  prevRevenue: 5100, prevCosts: 2890, prevMargin: 2210,
};

function renderFinancialPreview() {
  const role = localStorage.getItem('brewos_role') || 'owner';
  const permitted = ['admin','owner','finance'].includes(role);
  const section = document.getElementById('home-financial-section');
  if (section) section.style.display = permitted ? '' : 'none';
  if (!permitted) return;
  const d = FINANCIAL_DEMO;
  const arrow = (curr, prev) => curr >= prev ? '↑' : '↓';
  const arrowColor = (curr, prev) => curr >= prev ? '#059669' : '#dc2626';
  const fmt = v => `€${toNum(v).toLocaleString()}`;

  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

  setEl('fin-rev-value', fmt(d.revenue));
  setEl('fin-costs-value', fmt(d.costs));
  setEl('fin-margin-value', fmt(d.margin));
  setEl('fin-rev-arrow', arrow(d.revenue, d.prevRevenue));
  setEl('fin-costs-arrow', arrow(d.costs, d.prevCosts));
  setEl('fin-margin-arrow', arrow(d.margin, d.prevMargin));
  setStyle('fin-rev-arrow', 'color', arrowColor(d.revenue, d.prevRevenue));
  setStyle('fin-costs-arrow', 'color', arrowColor(d.costs, d.prevCosts));
  setStyle('fin-margin-arrow', 'color', arrowColor(d.margin, d.prevMargin));
  setEl('fin-rev-label', t('financial.revenue'));
  setEl('fin-costs-label', t('financial.costs'));
  setEl('fin-margin-label', t('financial.margin'));
}

// ── FINANCIAL PAGE ───────────────────────────────────────────────────────────
let finPeriod = localStorage.getItem('brewos_fin_period') || 'today';

const FINANCIAL_PAGE_DEMO = {
  today:  { revenue: 6480, costs: 3240, margin: 3240, prevRevenue: 5100, prevCosts: 2890, prevMargin: 2210,
            safeToSpend: 1756, vat: 864, excise: 120, tax: 480,
            flow: [
              { label: 'Unpaid invoices', value: '€1,200', note: '2 open', color: '#f59e0b' },
              { label: 'Overdue payments', value: '€480',  note: '1 overdue', color: '#ef4444' },
            ],
            costs: [
              { label: 'Raw materials', value: '€1,440', pct: 44 },
              { label: 'Packaging',     value: '€648',   pct: 20 },
              { label: 'Energy',        value: '€486',   pct: 15 },
              { label: 'Labour',        value: '€486',   pct: 15 },
              { label: 'Admin',         value: '€180',   pct: 6  },
            ],
            obligations: [
              { label: 'VAT declaration Q1',            date: '25 Apr 2026', status: 'upcoming' },
              { label: 'Quarterly excise declaration',  date: '20 Apr 2026', status: 'upcoming' },
            ],
          },
  week:   { revenue: 18200, costs: 9100, margin: 9100, prevRevenue: 16400, prevCosts: 8600, prevMargin: 7800,
            safeToSpend: 5200, vat: 2400, excise: 340, tax: 1300,
            flow: [
              { label: 'Unpaid invoices', value: '€3,400', note: '5 open', color: '#f59e0b' },
            ],
            costs: [
              { label: 'Raw materials', value: '€4,000', pct: 44 },
              { label: 'Packaging',     value: '€1,820', pct: 20 },
              { label: 'Energy',        value: '€1,365', pct: 15 },
              { label: 'Labour',        value: '€1,365', pct: 15 },
              { label: 'Admin',         value: '€550',   pct: 6  },
            ],
            obligations: [
              { label: 'VAT declaration Q1', date: '25 Apr 2026', status: 'upcoming' },
            ],
          },
  month:  { revenue: 74800, costs: 37400, margin: 37400, prevRevenue: 68000, prevCosts: 34000, prevMargin: 34000,
            safeToSpend: 21400, vat: 9800, excise: 1400, tax: 5400,
            flow: [
              { label: 'Unpaid invoices', value: '€12,600', note: '8 open',  color: '#f59e0b' },
              { label: 'Overdue payments', value: '€2,400', note: '2 overdue', color: '#ef4444' },
            ],
            costs: [
              { label: 'Raw materials', value: '€16,500', pct: 44 },
              { label: 'Packaging',     value: '€7,480',  pct: 20 },
              { label: 'Energy',        value: '€5,610',  pct: 15 },
              { label: 'Labour',        value: '€5,610',  pct: 15 },
              { label: 'Admin',         value: '€2,200',  pct: 6  },
            ],
            obligations: [
              { label: 'VAT declaration Q1',           date: '25 Apr 2026', status: 'upcoming' },
              { label: 'Quarterly excise declaration', date: '20 Apr 2026', status: 'upcoming' },
            ],
          },
};

function setFinPeriod(period) {
  finPeriod = period;
  localStorage.setItem('brewos_fin_period', period);
  ['today','week','month'].forEach(p => {
    const btn = document.getElementById('fin-tab-' + p);
    if (!btn) return;
    btn.classList.toggle('active', p === period);
  });
  renderFinancialPage();
  loadFinancialFromAirtable();
}

function renderFinancialPage() {
  const d = FINANCIAL_PAGE_DEMO[finPeriod];
  if (!d) return;
  const fmt = v => `€${toNum(v).toLocaleString()}`;
  const arrow = (curr, prev) => curr >= prev ? '↑' : '↓';
  const arrowColor = (curr, prev) => curr >= prev ? '#059669' : '#dc2626';
  const setEl = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  const setStyle = (id, prop, val) => { const el = document.getElementById(id); if (el) el.style[prop] = val; };

  setEl('fp-rev-val', fmt(d.revenue));
  setEl('fp-costs-val', fmt(d.costs));
  setEl('fp-margin-val', fmt(d.margin));
  setEl('fp-rev-arrow', arrow(d.revenue, d.prevRevenue));
  setEl('fp-costs-arrow', arrow(d.costs, d.prevCosts));
  setEl('fp-margin-arrow', arrow(d.margin, d.prevMargin));
  setStyle('fp-rev-arrow', 'color', arrowColor(d.revenue, d.prevRevenue));
  setStyle('fp-costs-arrow', 'color', arrowColor(d.costs, d.prevCosts));
  setStyle('fp-margin-arrow', 'color', arrowColor(d.margin, d.prevMargin));
  setEl('fp-safe-val', fmt(d.safeToSpend));
  setEl('fp-safe-label', t('financial.safe_to_spend'));
  setEl('fp-safe-sub', t('financial.safe_to_spend_label'));

  const flow = document.getElementById('fp-money-flow');
  if (flow) flow.innerHTML = d.flow.map(f => `
    <div style="background:#f9fafb; border-radius:12px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <p class="text-card-title" style="color:#111827; margin:0 0 2px;">${f.label}</p>
        <p class="text-meta">${f.note}</p>
      </div>
      <p class="card-title" style="color:${f.color}; margin:0;">${f.value}</p>
    </div>`).join('');

  const costBreak = document.getElementById('fp-cost-breakdown');
  if (costBreak) costBreak.innerHTML = d.costs.map(c => `
    <div style="display:flex; justify-content:space-between; align-items:center;">
      <p class="secondary-text" style="color:#374151; margin:0;">${c.label}</p>
      <div style="display:flex; align-items:center; gap:10px;">
        <div style="width:80px; height:6px; background:#e5e7eb; border-radius:3px; overflow:hidden;">
          <div style="width:${c.pct}%; height:100%; background:#111827; border-radius:3px;"></div>
        </div>
        <p class="secondary-text" style="margin:0; min-width:60px; text-align:right;">${c.value}</p>
      </div>
    </div>`).join('');

  const statusColors = { upcoming: '#f59e0b', due: '#ef4444', submitted: '#059669', overdue: '#ef4444' };
  const oblig = document.getElementById('fp-obligations');
  if (oblig) oblig.innerHTML = d.obligations.map(o => `
    <div style="background:#f9fafb; border-radius:12px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center;">
      <div>
        <p class="text-card-title" style="color:#111827; margin:0 0 2px;">${o.label}</p>
        <p class="text-meta">${o.date}</p>
      </div>
      <span class="text-meta-strong" style="color:${statusColors[o.status] || '#9ca3af'}; text-transform:capitalize;">${o.status}</span>
    </div>`).join('');

  setEl('fp-rev-label', t('financial.revenue'));
  setEl('fp-costs-label', t('financial.costs'));
  setEl('fp-margin-label', t('financial.margin'));
  setEl('fin-page-title', t('financial.title'));
  setEl('fp-flow-label', t('financial.money_flow'));
  setEl('fp-cost-label', t('financial.cost_pressure'));
  setEl('fp-oblig-label', t('financial.obligations'));
}

function dismissColorTip() {
  localStorage.setItem('brewos_color_tip_seen', '1');
  if (typeof syncGuidanceCardsVisibility === 'function') {
    syncGuidanceCardsVisibility();
    return;
  }
  const guide = document.getElementById('home-color-guide');
  if (guide) guide.style.display = 'none';
}

function maybeShowColorTip() {
  if (typeof syncGuidanceCardsVisibility === 'function') {
    syncGuidanceCardsVisibility();
    return;
  }
  const guide = document.getElementById('home-color-guide');
  if (!guide) return;
  guide.style.display = localStorage.getItem('brewos_color_tip_seen') === '1' ? 'none' : 'flex';
}
