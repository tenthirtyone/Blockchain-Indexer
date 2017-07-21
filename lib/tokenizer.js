const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const txs = require('./txs');
let idx = 0;
let counter;

let startTime = null;

function start() {
  console.log('Mocking ' + txs.length + ' txs');
  server.listen(3000, () => {
    console.log('Tokenizer listening on port 3000');
  });

  io.on('connection', (socket) => {
    startTime = Date.now();
    counter = 0;
    console.log(socket.handshake.query.name + ' connected');
    sendTx(socket);

    socket.on('getTx', function (data) {
      sendTx(socket);
    });
  });
}

function sendTx(socket) {
  if (counter < 1000000) {
    socket.emit('tx', txs[idx % txs.length]);
    idx++;
    counter++;
    if (counter % 10000 === 0) {
      console.log((Date.now() - startTime) / 1000);
    }
  } else {
    console.log('Tokenizer Complete');
    socket.emit('complete');
  }

}

module.exports = {
  start: start
}