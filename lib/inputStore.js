'use strict';

const app = require('express')();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const DB = require('bcoin-mongo-api');

class InputStore {

  constructor() {
    if (!(this instanceof InputStore)) {
      return new InputStore();
    }

    this.db = new DB({
      dbhost: '127.0.0.1',
      dbname: 'mapperData'
    });

    this.inputs = [];
    this.safeHeights = {};
    this.lastHeight = 0;
    this.mappers = [];
    this.server = server;
    this.io = io;
  }

  async start() {
    await this.db.open();

    const safeHeights = this.safeHeights;
    const getSafeHeight = this.getSafeHeight;

    this.server.listen(3002, () => {
      console.log('Input Store listening on port 3002');
    });

    this.io.on('connection', (socket) => {
      this.mappers.push(socket.id);
      this.startListeners(socket);
    });

    this.io.on('disconnect', (socket) => {
      this.mappers = this.mappers.filter((socketId) => {
        return socketId !== socket.id;
      });
    });
  }

  startListeners(socket) {
    console.log(socket.handshake.query.name + ' connected');

    socket.on('input', (data) => {
      if (!this.inputs[data.height]) {
        this.inputs[data.height] = [];
      }
      this.inputs[data.height].push(data);
    });

    socket.on('safeHeight', async (data) => {
      this.safeHeights[socket.id] = data.height;
      await this.checkInputs();
    });
  }

  async checkInputs() {
    let curHeight = this.lastHeight;
    let height = this.getSafeHeight();
    while (curHeight < height) {
      if (this.inputs[curHeight]) {

        this.inputs[curHeight].forEach(async (input) => {

          try {
            await this.db.updateSpentCoins(input.prevoutHash, input.spentTxId)
          } catch (e) {
            console.log(e)
          }
        });
        // Free the memory
        this.inputs[curHeight] = null;
      }
        curHeight++;
    }
    this.lastHeight = curHeight;
  }

  getSafeHeight() {
    let safeHeight = 999999999999;

    this.mappers.forEach(mapper => {
      if (this.safeHeights[mapper] < safeHeight ) {
        safeHeight = this.safeHeights[mapper];
      }
    });
    return safeHeight;
  }

}

module.exports = InputStore;