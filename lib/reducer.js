const request = require('request');

function reduceAddresses() {
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
        //console.log(address);
      }
      reduceAddresses();
    } else {
      console.log('reduce complete');
    }
  })
}