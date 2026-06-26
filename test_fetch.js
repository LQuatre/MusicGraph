const https = require('https');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const options = {
  hostname: 'musicbrainz.org',
  port: 443,
  path: '/ws/2/artist?query=artist:gims&fmt=json',
  method: 'GET',
  headers: {
    'User-Agent': 'MusicGraph/1.0.0',
    'Accept': 'application/json'
  },
  minVersion: 'TLSv1.2',
  maxVersion: 'TLSv1.2'
};

const req = https.request(options, (res) => {
  console.log('STATUS:', res.statusCode);
  console.log('HEADERS:', JSON.stringify(res.headers));
  res.setEncoding('utf8');
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => {
    console.log('BODY:', body.slice(0, 100));
  });
});

req.on('error', (e) => {
  console.error('ERROR:', e);
});

req.end();
