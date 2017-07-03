const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const storeClient = require('socket.io-client');

let addrStore;

let counter = 0;

function start() {
  addrStore = storeClient.connect('http://localhost:3002', {query: 'name=reducer'});

  addrStore.on('startReducers', () => {
    console.log('Reducer Started');
    getAddr();
  });

  addrStore.on('addr', (data) => {
    vals = data.vals
    console.log(data.addr + ': ' + vals.reduce((a,b) => a+b));
    getAddr();
  })

  addrStore.on('stop', () => {
    console.log('reducer Stopped');
  })

  server.listen(3003, () => {
    console.log('Reducer listening on port 3003');
  });
}

function getAddr() {
  addrStore.emit('getAddr');
}

module.exports = {
  start: start
}