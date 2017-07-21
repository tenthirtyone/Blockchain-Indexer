const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const tokenClient = require('socket.io-client');
const storeClient = require('socket.io-client');
let tokenizer;
let addrStore;

let counter = 0;

function start() {
  tokenizer = tokenClient.connect('http://localhost:3000', {query: 'name=mapper'});
  addrStore = storeClient.connect('http://localhost:3002', {query: 'name=mapper'});

  tokenizer.on('tx', (tx) => {
    if (tx) {
      tokens = createTokens(tx);
      counter++;
      if (counter % 1000 === 0) {
        console.log(counter);
      }
      tokens.map((token) => {
        if (token) {
          storeAddr(token);
        }
      });
      getToken();
    }
  })

  tokenizer.on('complete', () => {
    console.log('Mapper Complete');
    addrStore.emit('complete')
  })

  server.listen(3001, () => {
    console.log('Mapper listening on port 3001');
  });
}

function getToken() {
  tokenizer.emit('getTx')
}

function storeAddr(data) {
  addrStore.emit('storeAddr', data);
}

// Was faster to just let the mappers make their own tokens.
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