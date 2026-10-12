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

     if (event.httpMethod === 'POST') {
      try {
        console.log('[PROXY POST] body length:', (event.body || '').length);
        const bodyPreview = (event.body || '').substring(0, 200);
        console.log('[PROXY POST] body preview:', bodyPreview);

        const appsResponse = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: event.body,
          redirect: 'follow'
        });

        console.log('[PROXY POST] status:', appsResponse.status);
        console.log('[PROXY POST] content-type:', appsResponse.headers.get('content-type'));
        console.log('[PROXY POST] final url:', appsResponse.url);

        const text = await appsResponse.text();
        console.log('[PROXY POST] response preview:', text.substring(0, 300));

        // Если ответ — HTML, значит Apps Script нас не принял
        if (text.trim().toLowerCase().startsWith('<!doctype')) {
          return {
            statusCode: 200,
            headers: {
              ...CORS_HEADERS,
              'Content-Type': 'application/json; charset=utf-8'
            },
            body: JSON.stringify({
              ok: false,
              error: 'Apps Script вернул HTML вместо JSON. Скорее всего POST не поддерживается или нужна авторизация.',
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
        console.error('[PROXY POST] ERROR:', err);
        return {
          statusCode: 500,
          headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          body: JSON.stringify({ ok: false, error: 'Proxy error: ' + err.message })
        };
      }
    }
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
