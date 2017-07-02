const express = require('express');
const cluster = require('cluster');
const tokenizer = require('./lib/tokenizer');
const mapper = require('./lib/mapper');
const reducer = require('./lib/reducer');

const indexer = {
  tokenizer: tokenizer,
  mapper: mapper,
  reducer: reducer,
}

init(process.argv[2], process.argv[3]);

function init(type, numCPU)  {
  if (cluster.isMaster) {
    console.log(`Master ${process.pid} is running`);
    for (let i = 0; i < numCPU; i++)  {
      cluster.fork();
    }

    cluster.on('death', function(worker) {
      console.log(`Worker ${process.pid} has died`);
    });
  } else {
    indexer[type].start();
  }
}
