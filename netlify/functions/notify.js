const https = require('https');

exports.handler = async function(event) {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method not allowed' };
  }

  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    return { statusCode: 500, body: 'Missing Twilio credentials' };
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

  // Send to all numbers in parallel
  const sends = phones.map(function(phone) {
    return new Promise(function(resolve) {
      const postData = new URLSearchParams({
        To: '+1' + phone.replace(/\D/g, ''),
        From: fromNumber,
        Body: message
      }).toString();

      const options = {
        hostname: 'api.twilio.com',
        path: '/2010-04-01/Accounts/' + accountSid + '/Messages.json',
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(postData),
          'Authorization': 'Basic ' + Buffer.from(accountSid + ':' + authToken).toString('base64')
        }
      };

      const req = https.request(options, function(res) {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => resolve({ phone, status: res.statusCode }));
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
