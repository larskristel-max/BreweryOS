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
  const data = await airtableProxyRequest({ method: 'DELETE', table, id });
  if (data?.error || !data?.deleted || data?.id !== id) {
    const message = data?.error?.message
      || data?.error
      || `DELETE ${table} failed for record ${id}`;
    const err = new Error(message);
    err.payload = { method: 'DELETE', table, id };
    err.response = data;
    throw err;
  }
  return data;
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
  return r.json();
}
