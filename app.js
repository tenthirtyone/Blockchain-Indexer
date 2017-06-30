const express = require('express');
const request = require('request');
const txs = require('./txs');
const tokenizer = express();
const mapper = express();

let idx = 0;

let addressMap = {};
let addressMapKeys = [];
let addressMapIdx = 0;

const tokens = txs.map(tx => {
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
}).reduce((a, b) => {
    return a.concat(b);
  });

tokenizer.get('/', (req, res) => {
  if (idx < tokens.length - 1) {
    res.send(tokens[idx]);
    idx++;
  } else {
    res.status(204).send();
  }
});

tokenizer.listen(3000, () => {
  console.log('Tokenizer listening on port 3000');
});


mapper.get('/', (req, res) => {
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

mapper.listen(3001, () => {
  console.log('Mapper listening on port 3001');
});

mapToken();

function mapToken() {
  setTimeout(() => {
    request('http://localhost:3000', (err, res, token) => {

      if (res.statusCode === 200) {
        try {
          token = JSON.parse(token);
        } catch(e) {
          console.log(e)
          token = null;
        }
        if (token) {
          if (addressMap[token.addr]) {
            addressMap[token.addr].push(token.val);
          } else {
            addressMap[token.addr] = [token.val];
            addressMapKeys.push(token.addr);
          }
        }
        mapToken();
      } else {
        console.log('mapping complete');
        reduceAddresses();
      }
    })
  });
}

function reduceAddresses() {
  setTimeout(() => {
    request('http://localhost:3001', (err, res, address) => {

      if (res.statusCode === 200) {
        try {
          address = JSON.parse(address);
        } catch(e) {
          console.log(e)
          address = null;
        }
        if (address) {
          address.vals = address.vals.reduce((a, b) => {
            return a+b;
          })
          console.log(address);
        }
        reduceAddresses();
      } else {
        console.log('reduce complete');
      }
    })
  });
}