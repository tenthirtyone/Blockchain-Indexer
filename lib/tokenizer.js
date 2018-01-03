'use strict';

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const bcoin = require('bcoin');

const FullNode = bcoin.fullnode;

class Tokenizer {

  constructor() {
    if (!(this instanceof Tokenizer)) {
      return new Tokenizer();
    }

    this.idx = 0; // block index;
    this.mappers = [];
    this.paused = [];
    // Replace with p2p in the future
    this.node = new FullNode({
      network: 'main',
      db: 'leveldb',
      checkpoints: true,
      workers: true,
      logLevel: 'info',
      'max-inbound': 1,
      'max-outbound': 1,
      'http-port': 8332,
    });
  }

  async start() {
    await this.node.open();
    //await this.node.connect();
    //this.node.startSync();

    server.listen(3000, () => {
      console.log('Tokenizer listening on port 3000');
    });

    io.on('connection', async (socket) => {
      console.log(socket.handshake.query.name + ' connected');
      console.log(socket.id);
      this.mappers.push(socket.id);
      socket.emit('start');

      socket.on('getBlock', async (data) => {

        console.log(this.idx);
        if (this.idx === 1000) {
          socket.emit('pause');
          this.paused.push(socket.id);
          if (this.paused.length === this.mappers.length) {
            console.log('Committing inputs');
            this.mappers.forEach((mapper) => {
              io.to(mapper).emit('commitInputs');
            });
          }
        } else {
          this.idx++;
          await this.sendBlock(socket, this.idx);
        }
      });

      socket.on('disconnect', () => {
        // Remove from tracked mappers
        this.mappers = this.mappers.filter((socketId) => {
          return socketId !== socket.id;
        });
      })
    });
  }

  getBlock(height) {
    return this.node.chain.getBlock(height);
  }

  async sendBlock(socket) {
    let block = await this.getBlock(this.idx);
    const view = await this.node.chain.getBlockView(block);

    if (block) {
      socket.emit('block', {
        raw: block.toRaw(),
        view,
        idx: this.idx
      });
    } else {
      // No blocks, wait five seconds
      setTimeout(() => {
        sendBlock(socket);
      }, 5000)
    }

  }
}

module.exports = Tokenizer;