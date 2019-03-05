#!/usr/bin/env node
const fs = require('fs');
const program = require('commander');
const Worker = require('./index');

const pkg = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf8'));
const worker = new Worker();
program
  .version(pkg.version, '-v, --version')
  .option('-m, --message <msg>', '提前输入commit消息,与原生Git用法相同')
  .option('-s, --reset', '重置当前的safecommit配置')
  .option('-c, --swift-config <path>', '配置全局lint配置文件')
  .parse(process.argv);
worker.version = program.version();
if (program.reset) {
  worker.reset();
} else if (program.swiftConfig) {
  worker.setSwiftConfigPath(program.swiftConfig);
} else if (program.message) {
  worker.run(program.message);
} else {
  worker.run();
}
