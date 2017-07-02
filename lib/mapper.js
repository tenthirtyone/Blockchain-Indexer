const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const ioClient = require('socket.io-client');
let client

const request = require('request');

let addressMap = {};
let addressMapKeys = [];
let addressMapIdx = 0;

let counter = 0;

function start() {
  client = ioClient.connect('http://localhost:3000');

  client.on('tx', (tx) => {
    if (tx) {
      token = createToken(tx);
      counter++;
      if (counter % 1000 === 0) {
        console.log(counter);
      }
      if (addressMap[token.addr]) {
        addressMap[token.addr].push(token.val);
      } else {
        addressMap[token.addr] = [token.val];
        addressMapKeys.push(token.addr);
      }
      getToken();
    }
  })

  server.listen(3001, () => {
    console.log('Mapper listening on port 3000');
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

  getToken();
}

function getToken() {
  client.emit('getTx')
}

/*
function map() {
  request('http://localhost:3000', (err, res, tx) => {
    if (err) {
      console.log(err);
    } else {
      if (res.statusCode === 200) {
        try {
          tx = JSON.parse(tx);
        } catch(e) {
          //console.log(e)
          tx = null;
        }
        if (tx) {
          token = createToken(tx);
          counter++;
          if (counter % 1000 === 0) {
            console.log(counter);
          }
          if (addressMap[token.addr]) {
            addressMap[token.addr].push(token.val);
          } else {
            addressMap[token.addr] = [token.val];
            addressMapKeys.push(token.addr);
          }
        }
        map();
      } else {
        console.log('mapping complete');
        //reduceAddresses();
      }
    }
  });
}

*/

function createToken(tx) {
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