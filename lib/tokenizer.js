const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const request = require('request');
const txs = require('./txs');
let idx = 0;
let counter = 0;

let startTime = null;

function start() {
  server.listen(3000, () => {
    console.log('Tokenizer listening on port 3000');
  });

  app.get('/', (req, res) => {
    console.log(counter);
    res.send(txs[idx % txs.length]);
    idx++;
    counter++;
  });

  io.on('connection', (socket) => {
    startTime = Date.now();
    console.log('Socket connected')
    socket.on('getTx', function (data) {
      socket.emit('tx', txs[idx % txs.length]);
      idx++;
      counter++;
      if (counter % 100000 === 0) {
        console.log((Date.now() - startTime) / 1000);
      }
    });
  });
}

module.exports = {
  start: start
}

/*
const app = require('express');
var tokenizer = require('http').Server(app);
var io = require('socket.io')(tokenizer);
const request = require('request');
const txs = require('./txs');
let idx = 0;

function start() {
  app.get('/', (req, res) => {
    console.log(idx % txs.length)
    res.send(txs[idx % txs.length]);
    idx++;
  });

  tokenizer.listen(3000, () => {
    console.log('Tokenizer listening on port 3000');
  });
}


*/