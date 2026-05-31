const https = require('https');

exports.handler = async function(event) {
  const key = process.env.FLIGHTAWARE_KEY;
  if (!key) return { statusCode: 500, body: 'No API key' };

  const { flightNum, date } = event.queryStringParameters || {};
  if (!flightNum) return { statusCode: 400, body: 'Missing flightNum' };

  // FlightAware AeroAPI v4 endpoint
  const path = '/aeroapi/flights/' + encodeURIComponent(flightNum) +
    (date ? '?start=' + date + '&end=' + date : '');

  return new Promise((resolve) => {
    const options = {
      hostname: 'aeroapi.flightaware.com',
      path: path,
      method: 'GET',
      headers: {
        'x-apikey': key,
        'Accept': 'application/json'
      }
    };

    https.get(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json' },
          body: data
        });
      });
    }).on('error', (e) => {
      resolve({ statusCode: 500, body: JSON.stringify({ error: e.message }) });
    });
  });
};
