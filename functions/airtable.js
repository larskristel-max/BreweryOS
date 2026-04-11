export async function onRequestPost(context) {
  const { request, env } = context;

  const body = await request.json();
  const { baseId, method = 'GET', table, id, fields, params = '' } = body;

  const path = `${table}${id ? `/${id}` : ''}`;
  const url = `https://api.airtable.com/v0/${baseId}/${path}${params || ''}`;

  const options = {
    method,
    headers: {
      Authorization: `Bearer ${env.AIRTABLE_API_KEY}`,
      'Content-Type': 'application/json'
    }
  };

  if (method === 'PATCH' || method === 'POST') {
    options.body = JSON.stringify({ fields: fields || {} });
  }

  const res = await fetch(url, options);
  const data = await res.text();

  return new Response(data, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' }
  });
}
