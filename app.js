const express = require('express');
const request = require('request');
const txs = require('./txs');
const tokenizer = express();
const mapper = express();

let idx = 0;

const tokens = txs.map(tx => {
  return {
    inputs: tx.inputs.map(input => {
      if (input.prev_out) {
        return input.prev_out.addr + ':' + input.prev_out.value
      } else {
        return null;
      }
    }),
    outputs: tx.out.map(output => {
      return output.addr + ':' + output.value;
    })
  }
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
  console.log('listnin on port 3000');
});

mapToken();

function mapToken() {
  setTimeout(() => {
    request('http://localhost:3000', (err, res, body) => {
      console.log(res.statusCode)
      if (res.statusCode === 200) {
        console.log(body);
        mapToken();
      } else {
        console.log('mapping complete');
      }
    })
  });
}
