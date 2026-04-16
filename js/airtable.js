async function airtable(table, params='') {
  return airtableProxyRequest({ method: 'GET', table, params });
}

async function airtablePatch(table, id, fields) {
  return airtableProxyRequest({ method: 'PATCH', table, id, fields });
}

async function airtableCreate(table, fields) {
  return airtableProxyRequest({ method: 'POST', table, fields });
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
