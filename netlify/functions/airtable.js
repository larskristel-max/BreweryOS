exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Method Not Allowed' })
    };
  }

  const key = process.env.AIRTABLE_KEY;
  if (!key) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Missing AIRTABLE_KEY' })
    };
  }

  try {
    const payload = JSON.parse(event.body || '{}');
    const path = payload.path;
    const method = payload.method || 'GET';
    const requestBody = payload.body;

    if (!path || typeof path !== 'string' || !path.startsWith('/')) {
      return {
        statusCode: 400,
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid path' })
      };
    }

    const response = await fetch(`https://api.airtable.com/v0${path}`, {
      method,
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json'
      },
      body: requestBody ? JSON.stringify(requestBody) : undefined
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: { 'content-type': 'application/json' },
      body: text
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ error: 'Airtable proxy failed', details: error.message })
    };
  }
};
