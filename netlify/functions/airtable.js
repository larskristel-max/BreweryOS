exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method Not Allowed' }) };
  }

  try {
    const { method = 'GET', baseId, table, params = '', id, fields } = JSON.parse(event.body || '{}');
    const apiKey = process.env.AIRTABLE_KEY;

    if (!apiKey) {
      return { statusCode: 500, body: JSON.stringify({ error: 'AIRTABLE_KEY is not configured' }) };
    }
    if (!baseId || !table) {
      return { statusCode: 400, body: JSON.stringify({ error: 'baseId and table are required' }) };
    }

    let path = `${encodeURIComponent(table)}`;
    if (id) path += `/${encodeURIComponent(id)}`;
    if (params) path += params;

    const url = `https://api.airtable.com/v0/${baseId}/${path}`;
    const options = {
      method,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    };

    if (method === 'PATCH' || method === 'POST') {
      options.body = JSON.stringify({ fields: fields || {} });
    }

    const response = await fetch(url, options);
    const payload = await response.text();

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: payload
    };
  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Proxy request failed', detail: err.message })
    };
  }
};
