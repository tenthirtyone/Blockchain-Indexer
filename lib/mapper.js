'use strict';

const app = require('express')();
const server = require('http').Server(app);
const DB = require('bcoin-mongo-api');
const io = require('socket.io')(server);
const tokenClient = require('socket.io-client');
const inputClient = require('socket.io-client');
const bcoin = require('bcoin');
const Block = bcoin.primitives.Block;

class Mapper {
  constructor() {
    if (!(this instanceof Mapper)) {
      return new Mapper();
    }

    this.inputsCache = [];
    this.coinbaseHash = '0000000000000000000000000000000000000000000000000000000000000000';
    this.db = new DB({
      dbhost: '127.0.0.1',
      dbname: 'mapperData'
    });

    this.tokenizer = tokenClient.connect('http://localhost:3000', { query: 'name=mapper' });
    this.inputClient = tokenClient.connect('http://localhost:3002', { query: 'name=mapper' });
  }

  async start() {
    await this.db.open();

    this.tokenizer.on('block', async (block) => {
      console.log(block.idx);
      await this.processBlock(block);
      await this.getBlock();
    });

    this.tokenizer.on('start', () => {
      this.getBlock();
    });

    server.listen(3001, () => {
      console.log('Mapper listening on port 3001');
    });
  }

  async processBlock(block) {
      if (!block) {
        return;
      }

      let b = await Block.fromRaw(block.raw);
      // Block Entry Data
      let chainEntry = {
        height: block.height,
        hash: b.hash().toString('hex'),
        time: b.time
      };
      try {
        // Save Coins, then Txs, then block
        b.txs.forEach(async (tx) => {
          let idx = 0;
          // Save Outputs
          tx.outputs.forEach(async (output) => {
            let txHash = this.revHex(tx.hash().toString('hex'));
            await this.db.saveCoins(txHash, idx, output);
            idx++;
          });
          // Cache each input
          tx.inputs.forEach((input) => {
            let json = input.toJSON();
            let isCoinbase = input.prevout.hash === this.coinbaseHash;
            if (!isCoinbase) {
              this.inputClient.emit('input',
              {
                height: block.idx,
                spentTxId: this.revHex(tx.hash().toString('hex')),
                prevoutHash: json.prevout.hash
              });
            }
          })
          // save tx
          await this.db.saveBcoinTx(chainEntry, tx);

        });
        // Save Block
        await this.db.saveBcoinBlock(
          chainEntry,
          b);
      } catch (e) {
        console.log(e);
      }
      this.inputClient.emit('safeHeight', {
        height: block.idx
      });
  }

  async getBlock() {
    await this.tokenizer.emit('getBlock')
  }

  revHex(hexString) {
    let out = '';

    for (let i = 0; i < hexString.length; i += 2)
      out = hexString.slice(i, i + 2) + out;

    return out;

  }

}

module.exports = Mapper;
