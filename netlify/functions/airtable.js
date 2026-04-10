const AIRTABLE_BASE_URL = 'https://api.airtable.com/v0';

exports.handler = async (event) => {
  const apiKey = process.env.AIRTABLE_KEY;

  if (!apiKey) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'AIRTABLE_KEY is not configured' })
    };
  }

  const path = event.queryStringParameters?.path;
  if (!path || !path.startsWith('/')) {
    return {
      statusCode: 400,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Missing or invalid path parameter' })
    };
  }

  try {
    const response = await fetch(`${AIRTABLE_BASE_URL}${path}`, {
      method: event.httpMethod || 'GET',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: event.body && event.httpMethod !== 'GET' ? event.body : undefined
    });

    const text = await response.text();

    return {
      statusCode: response.status,
      headers: { 'Content-Type': 'application/json' },
      body: text || '{}'
    };
  } catch (error) {
    return {
      statusCode: 502,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Airtable proxy request failed' })
    };
  }
};
