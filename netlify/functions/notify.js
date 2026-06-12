const https = require('https');
const querystring = require('querystring');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const apiKey = process.env.TEXTBELT_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: 'Missing Textbelt API key' };
  }

  let body;
  try {
    body = JSON.parse(event.body);
  } catch(e) {
    return { statusCode: 400, body: 'Invalid JSON' };
  }

  const { name, location, phones } = body;
  if (!name || !location || !phones || !phones.length) {
    return { statusCode: 400, body: 'Missing required fields' };
  }

  const message = '\uD83D\uDCCD ' + name + ' just checked in at ' + location + ' \u2014 Keys Trip 2026';

  const sends = phones.map(function(phone) {
    return new Promise(function(resolve) {
      const postData = querystring.stringify({
        phone: phone.replace(/\D/g, ''),
        message: message,
        key: apiKey
      });

      const options = {
        hostname: 'textbelt.com',
        path: '/text',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData)
        }
      };

      const req = https.request(options, function(res) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ phone, status: res.statusCode, response: data }));
      });

      req.on('error', function(e) {
        resolve({ phone, error: e.message });
      });

      req.write(postData);
      req.end();
    });
  });

  const results = await Promise.all(sends);

  return {
    statusCode: 200,
    headers: { 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify({ sent: results.length, results: results })
  };
};
