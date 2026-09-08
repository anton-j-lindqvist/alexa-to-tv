import WebSocket from 'ws';
import 'dotenv/config';

const TV_IP = process.env.TV_IP;
const AUTH_TOKEN = process.env.AUTH_TOKEN;

const APP_NAME = 'NodeTVController';
const BASE64_APP_NAME = Buffer.from(APP_NAME).toString('base64');

export function sendKey(keyCode) {
  return new Promise((resolve, reject) => {
    let url = `wss://${TV_IP}:8002/api/v2/channels/samsung.remote.control?name=${BASE64_APP_NAME}`;
    if (AUTH_TOKEN) {
      url += `&token=${AUTH_TOKEN}`;
    }

    const ws = new WebSocket(url, {
      rejectUnauthorized: false,
      handshakeTimeout: 5000 // 5 sekunder timeout om TV:n inte svarar
    });

    ws.on('open', () => {
      console.log(`[TV] Ansluten till TV:n, förbereder '${keyCode}'...`);
    });

    ws.on('message', (data) => {
      try {
        const response = JSON.parse(data.toString());

        // Fånga eventuell ny token vid parkoppling
        if (response.event === 'ms.channel.connect') {
          if (response.data && response.data.token) {
            console.log('\n=============================================');
            console.log('SPARA DETTA TOKEN:', response.data.token);
            console.log('=============================================\n');
            AUTH_TOKEN = response.data.token;
          }

          // Skicka själva kommandot
          const payload = {
            method: 'ms.remote.control',
            params: {
              Cmd: 'Click',
              DataOfCmd: keyCode,
              Option: 'false',
              TypeOfRemote: 'SendRemoteKey'
            }
          };

          ws.send(JSON.stringify(payload));
          console.log(`[TV] Skickade ${keyCode}!`);

          // Ge TV:n 500ms att registrera kommandot innan vi stänger kopplingen
          setTimeout(() => {
            ws.close();
            resolve();
          }, 500);
        }
      } catch (err) {
        reject(err);
      }
    });

    ws.on('error', (err) => {
      console.error('[TV] WebSocket-fel:', err.message);
      reject(err);
    });
  });
}