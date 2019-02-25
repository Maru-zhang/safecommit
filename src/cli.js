#!/usr/bin/env node
const program = require('commander');
const Worker = require('./index');

program
  .version('0.0.1', '-v, --version')
  .option('-f, --fuck', '查看当前的版本')
  .option('-s, --reset', '重置当前的safecommit配置')
  .parse(process.argv);
  
const worker = new Worker();
if (program.reset) {
  worker.reset();
} else {
  worker.run();
}
