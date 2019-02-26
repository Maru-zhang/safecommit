#!/usr/bin/env node
const program = require('commander');
const Worker = require('./index');

const worker = new Worker();
program
  .version('1.0.0', '-v, --version')
  .option('-s, --reset', '重置当前的safecommit配置')
  .option('-c, --swift-config <path>', '配置全局lint配置文件')
  .parse(process.argv);
worker.version = program.version();
if (program.reset) {
  worker.reset();
} else if (program.swiftConfig) {
  worker.setSwiftConfigPath(program.swiftConfig);
} else {
  worker.run();
}
