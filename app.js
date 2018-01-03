const express = require('express');
const cluster = require('cluster');
const Tokenizer = require('./lib/tokenizer');
const Mapper = require('./lib/mapper');

const indexer = {
  tokenizer: Tokenizer,
  mapper: Mapper,
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
    const service = new indexer[type]();
    service.start();
  }
}

