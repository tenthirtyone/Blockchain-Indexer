const express = require('express');
const tokenizer = express();
const request = require('request');
const txs = require('./txs');
let idx = 0;

function start() {
  tokenizer.get('/', (req, res) => {
    console.log(idx % txs.length)
    res.send(txs[idx % txs.length]);
    idx++;
  });

  tokenizer.listen(3000, () => {
    console.log('Tokenizer listening on port 3000');
  });
}

module.exports = {
  start: start
}