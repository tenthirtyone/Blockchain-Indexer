const txs = require('./data.js');
const fs = require('fs');

const out = txs.map((tx) => {
  console.log(tx);
  return {
    inputs: tx.inputs,
    out: tx.out,
  }
});

console.log(out);

fs.writeFile("./dataOut.js", JSON.stringify(out), (err) => {
  if (err) {
    console.log(err);
  }

  console.log('file written');
});