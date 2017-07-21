# Blockchain Indexer
Distributed system concept. Connect to multiple blockchain data sources and map balances for addresses.
![Alt text](http://weaponizedmath.com/images/indexer.png "Optional title")

T - Tokenizer. Gets blockchain data for mappers.
M - Maps address: value pairs from inputs and outputs.
A - Address Store. Ghetto Redis. Mappers store data here. Starts reducers when mappers finish.
R - Reducers. Sums the address balances.

# Usage
Multitennant. Designed to run across multiple machines. Currently setup for localhost on different ports. Tokenizer is serving static json to simulate unrealistically fast I/O even for a distributed file system.

1. Start the tokenizer
```
node app.js tokenizer 1
```
2. Start an address store
```
node app.js addressStore 1
```
3. Start the reducers
```
node app.js reducer 1
```
4. Start the mappers - work will begin immediately
```
node app.js mapper 1
```

1 is the number of cpu to delegate. My laptop has 8 cores. I can usually run 8 mappers and 1 of each service without context switching affecting performance. Reducers will not run until mappers finish. If the tokenizer is running a mapper is idle. The addressStore is almost neglible.

The tokenizer will stop after 1,000,000 txs.

Everything runs over sockets but has a REST API for testing/debugging.