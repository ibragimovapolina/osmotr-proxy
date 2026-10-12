// Netlify Function — прокси к Apps Script
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzWLCPKI12R4Xi4pujuiOByL_SOyFTZ5u03KnuWz5LI7vyFBB31y9XBDBx6JOIPbPZg/exec';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Accept',
  'Access-Control-Max-Age': '86400'
};

exports.handler = async (event) => {
  console.log('=== PROXY CALLED ===');
  console.log('method:', event.httpMethod);
  console.log('path:', event.path);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  if (event.httpMethod === 'GET') {
    return handleGet(event);
  }

  if (event.httpMethod === 'POST') {
    return handlePost(event);
  }

  return {
    statusCode: 405,
    headers: CORS_HEADERS,
    body: 'Method not allowed'
  };
};

async function handleGet(event) {
  const query = event.rawQuery ? '?' + event.rawQuery : '';
  const targetUrl = APPS_SCRIPT_URL + query;

  console.log('[GET] targetUrl:', targetUrl);

  try {
    const response = await fetch(targetUrl, {
      method: 'GET',
      redirect: 'follow'
    });

    const text = await response.text();
    console.log('[GET] status:', response.status);
    console.log('[GET] content-type:', response.headers.get('content-type'));
    console.log('[GET] preview:', text.substring(0, 200));

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: text
    };
  } catch (err) {
    console.error('[GET] ERROR:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Proxy GET error: ' + err.message })
    };
  }
}

async function handlePost(event) {
  console.log('[POST] body length:', (event.body || '').length);
  console.log('[POST] body preview:', (event.body || '').substring(0, 200));

  try {
    const response = await fetch(APPS_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: event.body,
      redirect: 'follow'
    });

    const text = await response.text();
    console.log('[POST] status:', response.status);
    console.log('[POST] content-type:', response.headers.get('content-type'));
    console.log('[POST] final url:', response.url);
    console.log('[POST] preview:', text.substring(0, 300));

    if (text.trim().toLowerCase().startsWith('<!doctype')) {
      return {
        statusCode: 200,
        headers: {
          ...CORS_HEADERS,
          'Content-Type': 'application/json; charset=utf-8'
        },
        body: JSON.stringify({
          ok: false,
          error: 'Apps Script вернул HTML вместо JSON',
          firstChars: text.substring(0, 200)
        })
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: text
    };
  } catch (err) {
    console.error('[POST] ERROR:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Proxy POST error: ' + err.message })
    };
  }
}
