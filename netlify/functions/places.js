const https = require('https');

exports.handler = async function(event) {
  const { query, placeId, type } = event.queryStringParameters;
  const key = process.env.GOOGLE_PLACES_KEY;

  let url;
  if (placeId) {
    url = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=rating,user_ratings_total,price_level,opening_hours&key=${key}`;
  } else if (query) {
    url = `https://maps.googleapis.com/maps/api/place/findplacefromtext/json?input=${encodeURIComponent(query)}&inputtype=textquery&fields=place_id,rating,user_ratings_total,price_level&key=${key}`;
  } else if (type) {
    const { lat, lng, radius } = event.queryStringParameters;
    url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=${radius || 800}&type=${type}&key=${key}`;
  }

  return new Promise((resolve) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: 200,
          headers: { 'Access-Control-Allow-Origin': '*' },
          body: data
        });
      });
    }).on('error', () => {
      resolve({ statusCode: 500, body: 'Error' });
    });
  });
};
