const WebSocket = require('ws');
const fs = require('fs');

const pcm_file = './stream/win-wav.wav';
let interval = 0,
    bytesChunk = 292000,
    offset = 0,
    pcmData,
    wss;

fs.readFile(pcm_file, (err, data) => {
    if (err) throw err;
    pcmData = data;
    openSocket();
});


function openSocket() {
  wss = new WebSocket.Server({ port: 5000 });
  console.log(`[${new Date()}] Server port: 5000 ready...`);
  wss.on('connection', function connection(ws) {
        console.log(`[${new Date()}] Socket connected. Listen Message...`);

        ws.on('message', function incoming(message) {

            console.log(`[${new Date()}] incoming msg: ${message}`);
            if (message === 'start') {
                if (interval) {
                    clearInterval(interval);
                }
                console.log(`[${new Date()}] bytesChunk: ${bytesChunk}`);
                interval = setInterval(() => sendData(), 100);
            }
        });
        
  });
}

function sendData() {
    let payload;
    if (offset >= pcmData.length) {
       clearInterval(interval);
       offset = 0;
       console.log(`[${new Date()}] send data end.`);
       return;
    }
    
    payload = pcmData.subarray(offset, (offset + bytesChunk));
    offset += bytesChunk;
    console.log(`[${new Date()}] Send Data total size: ${offset}`);

    wss.clients.forEach(function each(client) {
      if (client.readyState === WebSocket.OPEN) {
          client.send(payload);
      }
    });
}