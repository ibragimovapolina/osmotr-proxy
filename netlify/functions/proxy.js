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
  console.log('rawQuery:', event.rawQuery);

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS_HEADERS, body: '' };
  }

  try {
    let targetUrl;
    let fetchOptions;

    if (event.httpMethod === 'GET') {
      const query = event.rawQuery ? '?' + event.rawQuery : '';
      targetUrl = APPS_SCRIPT_URL + query;
      fetchOptions = { method: 'GET', redirect: 'follow' };
    } else if (event.httpMethod === 'POST') {
      targetUrl = APPS_SCRIPT_URL;
      fetchOptions = {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: event.body,
        redirect: 'follow'
      };
    } else {
      return { statusCode: 405, headers: CORS_HEADERS, body: 'Method not allowed' };
    }

    console.log('targetUrl:', targetUrl);

    const response = await fetch(targetUrl, fetchOptions);
    const text = await response.text();

    console.log('response length:', text.length);
    console.log('response preview:', text.substring(0, 100));

    return {
      statusCode: 200,
      headers: {
        ...CORS_HEADERS,
        'Content-Type': 'application/json; charset=utf-8'
      },
      body: text
    };
  } catch (err) {
    console.error('ERROR:', err);
    return {
      statusCode: 500,
      headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ ok: false, error: 'Proxy error: ' + err.message })
    };
  }
};
