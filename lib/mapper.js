const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const ioClient = require('socket.io-client');
let client

const request = require('request');

let addressMap = {};
let addressMapKeys = [];
let addressMapIdx = 0;

let startTime = Date.now();
let counter = 0;

function start() {
  client = ioClient.connect('http://localhost:3000');

  client.on('tx', (tx) => {
    if (tx) {
      tokens = createTokens(tx);
      counter++;
      if (counter % 10000 === 0) {
        console.log(counter);
        console.log((Date.now() - startTime) / 1000);
      }
      tokens.map((token) => {
        if (token) {
          if (addressMap[token.addr]) {
            addressMap[token.addr].push(token.val);
          } else {
            addressMap[token.addr] = [token.val];
            addressMapKeys.push(token.addr);
          }
        }
      });

      getToken();
    }
  })

  server.listen(3001, () => {
    console.log('Mapper listening on port 3001');
  });

  app.get('/', function (req, res) {
    if (addressMapIdx < addressMapKeys.length - 1) {
      let addr = addressMapKeys[addressMapIdx];
      res.send({
        addr: addr,
        vals: addressMap[addr],
      });
      addressMapIdx++;
    } else {
      res.status(204).send();
    }
  });
}

function getToken() {
  client.emit('getTx')
}

function createTokens(tx) {
  return [
    tx.inputs.map(input => {
      if (input.prev_out) {
        return {
          addr: input.prev_out.addr,
          val: -input.prev_out.value,
        }
      } else {
        // implicit but adding for clarity
        return null;
      }
    }),
    tx.out.map(output => {
      return {
        addr: output.addr,
        val: output.value,
      }
    })
  ].reduce((a, b) => {
    return a.concat(b);
  });
}

module.exports = {
  start: start
}