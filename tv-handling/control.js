import WebSocket from 'ws';
import 'dotenv/config';

const TV_IP = process.env.TV_IP;
let AUTH_TOKEN = process.env.AUTH_TOKEN;

const APP_NAME = 'NodeTVController';
const BASE64_APP_NAME = Buffer.from(APP_NAME).toString('base64');

export function sendKey(keyData) {
  return new Promise((resolve, reject) => {
    let url = `wss://${TV_IP}:8002/api/v2/channels/samsung.remote.control?name=${BASE64_APP_NAME}`;
    if (AUTH_TOKEN) {
      url += `&token=${AUTH_TOKEN}`;
    }

    const ws = new WebSocket(url, {
      rejectUnauthorized: false,
      handshakeTimeout: 5000 // 5 sekunder timeout om TV:n inte svarar
    });

    //Actual command sent to TV
    const payload = {
      method: 'ms.remote.control',
      params: {
        Cmd: 'Click',
        DataOfCmd: keyData.key,
        Option: 'false',
        TypeOfRemote: 'SendRemoteKey'
      }
    };

    ws.on('open', () => {
      console.log("Connected to tv");
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

          console.log(`[TV] Skickade ${keyData.key}!`);
        }
      } catch (err) {
        reject(err);
      }
    });

    ws.on('connect', () => {
      let sent = 0;

      const interval = setInterval(function () {
        ws.send(JSON.stringify(payload));
        sent++;

        if (sent >= keyData.count) {
          clearInterval(interval);
          setTimeout(function () {
            ws.close();
            resolve();
          }, 100);
        }
      }, 150);
    })

    ws.on('error', (err) => {
      console.error('[TV] WebSocket-fel:', err.message);
      reject(err);
    });
  });
}