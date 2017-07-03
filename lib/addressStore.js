const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

let addressMap = {};
let addressMapKeys = [];
let idx = 0;

let mappers = 0;
let finished = 0;

let counter = 0;
let startTime = null;

function start() {

  server.listen(3002, () => {
    console.log('Address Store listening on port 3002');
  });

  app.get('/', function (req, res) {
    if (addressMapIdx < addressMapKeys.length - 1) {
      let addr = addressMapKeys[addressMapIdx];
      res.send({
        addr: addr,
        vals: addressMap[addr],
      });
    } else {
      res.status(204).send();
    }
  });

  io.on('connection', (socket) => {
    console.log(socket.handshake.query.name + ' connected');

    if (socket.handshake.query.name === 'mapper') {
      mappers++;
    }

    startTime = Date.now();
    socket.on('storeAddr', (data) => {
      let token = data;
      if (addressMap[token.addr]) {
        addressMap[token.addr].push(token.val);
      } else {
        addressMap[token.addr] = [token.val];
        addressMapKeys.push(token.addr);
      }
      counter++;
      if (counter % 100000 === 0) {
        console.log(counter);
        console.log((Date.now() - startTime) / 1000);
      }
    });

    socket.on('complete', (data) => {
      console.log('Mapper Reporting Finished');
      finished++;
      if (finished === mappers) {
        console.log('start the reducers. Tokenizer is finished.');
        io.sockets.emit('startReducers');
        finished = 0;
      }
    });

    socket.on('getAddr', () => {
      if (idx < addressMapKeys.length) {
        socket.emit('addr', {
          addr: addressMapKeys[idx],
          vals: addressMap[addressMapKeys[idx]]
        });
        idx++;
      } else {
        socket.emit('stop');
      }
    });
  });

}

module.exports = {
  start: start
}