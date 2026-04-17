const SEMANTIC = {

  // ── NOTION_HOOK 1 ── Object type mapping (temporary hardcode) ───────────────
  tableToType: {
    // Brewery base
    'Batches':            'process_run',
    'Ingredients':        'input_material',
    'Brew Logs':          'measurement',
    'Lots':               'output_lot',
    'Sales':              'transaction',
    'Issues':             'issue',
    'Tasks':              'task',
    // Generic base
    'Process Runs':       'process_run',
    'Input Materials':    'input_material',
    'Measurements':       'measurement',
    'Output Lots':        'output_lot',
    'Transactions':       'transaction',
  },

  // ── NOTION_HOOK 2 ── Semantic states (temporary hardcode) ───────────────────
  states: {
    process_run:    ['planned', 'ready_for_execution', 'in_progress', 'completed', 'blocked', 'invalid'],
    input_material: ['available', 'reserved', 'consumed', 'expired', 'blocked'],
    measurement:    ['pending', 'valid', 'invalid', 'missing'],
    output_lot:     ['planned', 'created', 'validated', 'released', 'blocked'],
    transaction:    ['pending', 'validated', 'executed', 'failed'],
    issue:          ['open', 'diagnosed', 'resolved', 'closed'],
    task:           ['pending', 'in_progress', 'completed', 'blocked'],
  },

  // ── Status normalization ─────────────────────────────────────────────────────
  // Raw Airtable values → canonical semantic states
  // Never let raw strings become semantic truth directly
  statusMapping: {
    process_run: {
      fieldByTable: {
        'Batches':       'Status',
        'Process Runs':  'Status',
      },
      values: {
        'Planned':               'planned',
        'Ready':                 'ready_for_execution',
        'Ready for Execution':   'ready_for_execution',
        'In Progress':           'in_progress',
        'Completed':             'completed',
        'Blocked':               'blocked',
        'Invalid':               'invalid',
        // live brewery compatibility
        'Brewing':               'in_progress',
        'Done':                  'completed',
      },
    },
    input_material: {
      fieldByTable: {
        'Ingredients':     'Status',
        'Input Materials': 'Status',
      },
      values: {
        'Available':    'available',
        'Reserved':     'reserved',
        'Consumed':     'consumed',
        'Expired':      'expired',
        'Blocked':      'blocked',
        'Quarantined':  'blocked',
      },
    },
    measurement: {
      fieldByTable: {
        'Brew Logs':    'Log Status',
        'Measurements': 'Status',
      },
      values: {
        'Pending':      'pending',
        'Valid':        'valid',
        'Invalid':      'invalid',
        'Missing':      'missing',
        // live brewery compatibility
        'Mashing':      'pending',
        'Boiling':      'pending',
        'Fermenting':   'pending',
        'Bottling':     'pending',
        'Complete':     'valid',
      },
    },
    output_lot: {
      fieldByTable: {
        'Lots':        'Status',
        'Output Lots': 'Status',
      },
      values: {
        'Planned':   'planned',
        'Created':   'created',
        'Validated': 'validated',
        'Blocked':   'blocked',
        'On Hold':   'blocked',
        'Released':  'released',
      },
    },
    transaction: {
      fieldByTable: {
        'Sales':        'Status',
        'Transactions': 'Status',
      },
      values: {
        'Pending':      'pending',
        'Validated':    'validated',
        'Executed':     'executed',
        'Completed':    'executed',
        'Failed':       'failed',
        // live brewery compatibility
        'Confirmed':    'validated',
        'Delivered':    'executed',
      },
    },
    issue: {
      fieldByTable: {
        'Issues': 'Status',
      },
      values: {
        'Open':         'open',
        'Diagnosed':    'diagnosed',
        'Acknowledged': 'diagnosed',
        'Resolved':     'resolved',
        'Closed':       'closed',
        // live brewery compatibility
        'In Progress':  'diagnosed',
      },
    },
    task: {
      fieldByTable: {
        'Tasks': 'Status',
      },
      values: {
        'Pending':     'pending',
        'In Progress': 'in_progress',
        'Active':      'in_progress',
        'Completed':   'completed',
        'Blocked':     'blocked',
        'Cancelled':   'blocked',
        // live brewery compatibility
        'To Do':       'pending',
        'Done':        'completed',
        'Skipped':     'blocked',
      },
    },
  },

  // ── NOTION_HOOK 3 ── Readiness conditions (temporary hardcode) ──────────────
  // sourceKey     = machine bridge key (stable, matches App Semantic Links)
  // airtableField = compatibility binding only — never shown in UI
  // label         = user-facing explainability text only
  readinessConditionsFallback: [
    {
      sourceKey:     'material_availability',
      airtableField: 'Material Available?',
      label:         'Materials are available',
    },
    {
      sourceKey:     'process_completion_state',
      airtableField: 'Process Complete?',
      label:         'Process is complete',
    },
    {
      sourceKey:     'system_readiness',
      airtableField: 'System Ready?',
      label:         'System is ready',
    },
    {
      sourceKey:     'measurement_reliability',
      airtableField: 'Measurements Valid?',
      label:         'Measurements are valid',
    },
    {
      sourceKey:     'output_lot_integrity',
      airtableField: 'Output Lot Exists?',
      label:         'Output lot exists',
      appComputed:   true,
      // ⚠️ NO WRITE-BACK — app-computed only, never PATCHed to Airtable
      // Airtable field exists for schema compatibility only
    },
    {
      sourceKey:     'control_execution_validity',
      airtableField: 'Controls Executed?',
      label:         'Controls have been executed',
    },
  ],

  // ── Status normalizer helper ──────────────────────────────────────────────────
  normalizeStatus(tableName, rawValue) {
    const type = this.tableToType[tableName];
    if (!type) return rawValue;
    const map = this.statusMapping[type];
    if (!map) return rawValue;
    const raw = (rawValue && typeof rawValue === 'object' && rawValue.name)
      ? rawValue.name
      : (rawValue || '');
    return map.values[raw] || raw;
  },

  // ── Condition evaluator ───────────────────────────────────────────────────────
  evaluateCondition(record, condition, context = {}) {
    if (condition.appComputed) {
      if (condition.sourceKey === 'output_lot_integrity') {
        const lots = context.linkedLots;
        if (Array.isArray(lots)) return lots.length > 0;
        // Fall back to Airtable checkbox if linkedLots not provided
        const fieldVal = (record || {})[condition.airtableField];
        // Absent field = indeterminate (not a known failure); only explicit false blocks
        if (fieldVal === undefined || fieldVal === null) return true;
        return fieldVal === true || fieldVal === 1;
      }
    }
    const value = (record || {})[condition.airtableField];
    // Absent field = indeterminate (not a known failure); only explicit false blocks
    if (value === undefined || value === null) return true;
    return value === true || value === 1;
  },

  // ── Readiness engine ──────────────────────────────────────────────────────────
  // Returns { ready: bool, failing: string[] }
  // failing[] contains semantic labels only — never raw field names
  computeReadiness(record, context = {}, readinessConditions = this.readinessConditionsFallback) {
    const failing = [];
    for (const condition of readinessConditions) {
      const pass = this.evaluateCondition(record, condition, context);
      if (!pass) failing.push(condition.label);
    }
    return {
      ready:   failing.length === 0,
      failing,
    };
  },

};

// ─── NOTION SEMANTIC LOADER ───────────────────────────────────────────────────
// Loads readinessConditions from Notion App Semantic Graph + App Semantic Links
// Falls back to SEMANTIC.readinessConditionsFallback if Notion is unavailable
// or returns incomplete data.
// Do NOT change statusMapping, normalizeStatus, evaluateCondition, or output shape.

async function loadSemanticGraphDrivers() {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      mcp_servers: [
        { type: 'url', url: 'https://mcp.notion.com/mcp', name: 'notion-mcp' }
      ],
      messages: [{
        role: 'user',
        content: `Query the Notion data source at collection://e979f681-d893-484c-b946-71b081a4d74d.
Return ONLY a JSON array of rows where "Is Readiness Driver" is checked/true.
Each row must have exactly these fields:
- entityKey (from "Entity Key")
- displayLabel (from "Display Label")
- airtableFieldName (from "Airtable Field Name")
- appComputed (from "App Computed", boolean)
Return ONLY the JSON array. No explanation. No markdown.`
      }]
    })
  });
  const data = await response.json();
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

async function loadExecutionReadinessEdges() {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      mcp_servers: [
        { type: 'url', url: 'https://mcp.notion.com/mcp', name: 'notion-mcp' }
      ],
      messages: [{
        role: 'user',
        content: `Query the Notion data source at collection://3a20437a-298c-4dc5-b13e-7222066fe391.
Return ONLY a JSON array of rows where "Target Entity Key" equals "execution_readiness".
Each row must have exactly these fields:
- sourceEntityKey (from "Source Entity Key")
- targetEntityKey (from "Target Entity Key")
- relationType (from "Relation Type")
Return ONLY the JSON array. No explanation. No markdown.`
      }]
    })
  });
  const data = await response.json();
  const text = data.content.filter(b => b.type === 'text').map(b => b.text).join('');
  const clean = text.replace(/```json|```/g, '').trim();
  return JSON.parse(clean);
}

function buildReadinessConditions(drivers, edges) {
  const edgeSourceKeys = edges
    .filter(e => e.targetEntityKey === 'execution_readiness')
    .map(e => e.sourceEntityKey);

  return drivers
    .filter(d => edgeSourceKeys.includes(d.entityKey))
    .map(d => ({
      sourceKey:     d.entityKey,
      airtableField: d.airtableFieldName,
      label:         d.displayLabel,
      appComputed:   d.appComputed === true,
    }));
}

function validateReadinessConditions(conditions) {
  if (!Array.isArray(conditions)) return false;
  if (conditions.length !== 6) return false;
  for (const c of conditions) {
    if (!c.sourceKey)     return false;
    if (!c.airtableField) return false;
    if (!c.label)         return false;
  }
  return true;
}

async function getReadinessConditions() {
  try {
    const [drivers, edges] = await Promise.all([
      loadSemanticGraphDrivers(),
      loadExecutionReadinessEdges()
    ]);
    const conditions = buildReadinessConditions(drivers, edges);

    if (validateReadinessConditions(conditions)) {
      console.log('Readiness conditions loaded from Notion:', conditions.length, 'drivers');
      console.log('[Semantic] Notion promoted: ', conditions.map(c => c.sourceKey));
      return conditions;
    }

    console.warn(
      'Notion readinessConditions failed validation.',
      'Got:', conditions.length, 'conditions. Using fallback.'
    );
    return SEMANTIC.readinessConditionsFallback;

  } catch (err) {
    console.warn('Failed to load readinessConditions from Notion. Using fallback.', err);
    console.warn('[Semantic] Fallback active. Conditions count:', SEMANTIC.readinessConditionsFallback.length);
    return SEMANTIC.readinessConditionsFallback;
  }
}

function getObjectType(tableName) {
  return SEMANTIC.tableToType[tableName] || 'unknown';
}
