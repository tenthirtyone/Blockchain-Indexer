const express = require('express');
const app = express();
const txs = require('./txs');
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

app.get('/', (req, res) => {
  res.send(tokens[idx]);
  idx++;
});

app.listen(3000, () => {
  console.log('listnin on port 3000');
});