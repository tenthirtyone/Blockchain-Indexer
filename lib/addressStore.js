const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);

const request = require('request');

let addressMap = {};
let addressMapKeys = [];
let addressMapIdx = 0;
let connections = 0;
let finished = 0;

let counter = 0;
let startTime = null;

function start() {

  server.listen(3002, () => {
    console.log('Address Store listening on port 3000');
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
    console.log('Socket connected');
    startTime = Date.now();
    connections++;
    socket.on('storeAddr', function (data) {
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
        console.log(addressMap);
      }
    });

    socket.on('complete', function (data) {
      finished++;
      if (finished === connections) {
        console.log('start the reducers. Tokenizer is finished.');
      }
    });
  });

}

module.exports = {
  start: start
}