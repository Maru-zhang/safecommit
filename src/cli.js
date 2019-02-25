#!/usr/bin/env node
const program = require('commander');
const Worker = require('./index');

program
  .version('0.0.1', '-v, --version')
  .option('-f, --fuck', '查看当前的版本')
  .parse(process.argv);

const worker = new Worker();
worker.run();
