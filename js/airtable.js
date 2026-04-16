async function airtable(table, params='') {
  return airtableProxyRequest({ method: 'GET', table, params });
}

async function airtablePatch(table, id, fields) {
  return airtableProxyRequest({ method: 'PATCH', table, id, fields });
}

async function airtableCreate(table, fields) {
  return airtableProxyRequest({ method: 'POST', table, fields });
}

async function airtableDelete(table, id) {
  return airtableProxyRequest({ method: 'DELETE', table, id });
}

async function airtableProxyRequest(payload) {
  const r = await fetch('/airtable', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      baseId: BASE,
      ...payload
    })
  });
  const data = await r.json();
  if (!r.ok || data?.error) {
    const message = data?.error?.message
      || data?.error
      || `${payload?.method || 'GET'} ${payload?.table || 'unknown-table'} failed (${r.status})`;
    const err = new Error(message);
    err.status = r.status;
    err.payload = payload;
    err.response = data;
    throw err;
  }
  return data;
}
