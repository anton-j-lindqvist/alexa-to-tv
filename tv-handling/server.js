import http from 'http';
import { json } from 'node:stream/consumers';
import * as control from './control.js';
import 'dotenv/config';

const SERVER_PORT = process.env.SERVER_PORT || 3000;

const server = http.createServer(async (req, res) => {
  // Tillåt bara POST-anrop
  if (req.method !== 'POST') {
    res.writeHead(405, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Method Not Allowed' }));
  }

  try {
    // Läser in och parsar inkommande JSON automatiskt
    const payload = await json(req);

    if (!payload || !payload.key) {
      res.writeHead(400, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ error: 'Missing "key" in request body' }));
    }

    console.log(`Mottog kommando: ${payload.key}`);
    await control.sendKey(payload.key);

    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'success', key: payload.key }));

  } catch (error) {
    console.error('Fel vid hantering av request:', error);

    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ error: 'Internal Server Error' }));
  }
});

// Lyssna på '0.0.0.0' istället för 'localhost' om servern ska nås från externa enheter/tunnlar
server.listen(SERVER_PORT, '0.0.0.0', () => {
  console.log(`Server körs på http://localhost:${SERVER_PORT}`);
});
