#!/usr/bin/env node
const { exec } = require('child_process');
require('colors');
const fs = require('fs');
const nconf = require('nconf');
const inquirer = require('inquirer');
const request = require('request');
const { deleteFolderRecursive, checkUpdate } = require('./utils');
const { commitQuestion } = require('./datasource/commitds');
const { Strategy } = require('./provider/strategy');
const swiftProvider = require('./provider/swift-provider');
const javaProvider = require('./provider/java-provider');
const noneProvider = require('./provider/none-provider');
const { checkMessage, evaluateMessage } = require('./provider/msglinter');

const cwd = process.cwd();
const home = process.env.HOME;
const gitHome = `${cwd}/.git`;
const scHome = `${cwd}/.git/safecommit`;
const scLocalConfig = `${scHome}/config.json`;
const globalSCHome = `${home}/.safecommit`;

class Worker {
  constructor() {
    this.providers = [swiftProvider, javaProvider, noneProvider];
    this.version = null;
    this.didUpdate = false;
  }

  createGlobalDirIfneed() {
    if (fs.existsSync(globalSCHome)) {
      return;
    }
    fs.mkdirSync(globalSCHome, null);
  }

  createLocalDirIfneed() {
    return new Promise((resolve) => {
      if (!fs.existsSync(scHome)) {
        fs.mkdirSync(scHome, null);
      }
      nconf.argv().env().file({ file: scLocalConfig });
      if (fs.existsSync(scLocalConfig)) {
        resolve();
        return;
      }
      const questions = [
        {
          type: 'rawlist',
          name: 'language',
          message: '请选择当前项目所使用的语言',
          choices: this.providers.map(x => x.chooiceItem()),
        },
      ];
      inquirer.prompt(questions).then((answers) => {
        nconf.set('language', answers.language);
        nconf.save();
        resolve();
      });
    });
  }

  // 执行lint的核心方法
  async excuteLint() {
    const excutor = this.findSuitableLinter();
    if (!excutor) { return; }
    await excutor.lint();
  }

  /**
   * 执行代码格式化
   */
  async excuteFormat() {
    const excutor = this.findSuitableLinter();
    if (!excutor) { return; }
    await excutor.format();
  }

  /**
   * 找到当前最适合的linter
   */
  findSuitableLinter() {
    nconf.argv().env().file({ file: scLocalConfig });
    const language = nconf.get('language');
    const provider = this.providers.filter(x => x.languageName() === language);
    if (provider.length === 0) {
      console.log('没有发现可用的lint'.red);
      return null;
    }
    const excutor = provider[0];
    if (this.didUpdate) {
      excutor.didUpdate();
    }
    return excutor;
  }

  // 重置当前git的hook目录环境
  reset() {
    if (!fs.existsSync(gitHome)) {
      console.error('当前目录非Git目录或者非Git根目录，请切换目录再试~'.red);
      return;
    }
    try {
      deleteFolderRecursive(scHome);
      fs.unlinkSync(`${gitHome}/hooks/sc-commit-msg.js`);
      fs.unlinkSync(`${gitHome}/hooks/commit-msg`);
      console.log('当前的环境已经重置'.green);
    } catch (error) {
      console.log('当前的环境已经重置'.red);
    }
  }

  buryHooks() {
    const path = `${gitHome}/hooks`;
    if (!fs.existsSync(path)) {
      fs.mkdirSync(path);
    }
    let content = '#!/usr/bin/env node\n';
    content += 'try {\n';
    content += '    Worker = require(process.argv[2]);\n';
    content += '    worker = new Worker();\n';
    content += '    worker.run_before_commit();\n';
    content += '} catch (error) {}\n';
    fs.writeFileSync(`${path}/sc-commit-msg.js`, content);
    content = '#!/usr/bin/env bash\n';
    content += 'PATH="/usr/local/bin:$PATH"\n';
    content += 'NODE_PATH="/usr/lib/node_modules/safecommit"\n';
    content += 'if [ -f $HOME/.nvm/nvm.sh ]\n';
    content += 'then\n';
    content += '  . $HOME/.nvm/nvm.sh\n';
    content += '  PATH="$HOME/.nvm/versions/node/$(nvm current)/bin:$PATH"\n';
    content += '  NODE_PATH="$HOME/.nvm/versions/node/$(nvm current)/lib/node_modules/safecommit"\n';
    content += 'fi\n';
    content += 'node ./.git/hooks/sc-commit-msg.js $NODE_PATH\n';
    fs.writeFileSync(`${path}/commit-msg`, content);
    fs.chmodSync(`${path}/commit-msg`, '777');
  }

  /* 配置全局路径 */
  setSwiftConfigPath(path) {
    if (!path) {
      console.error('非法地址!'.red);
      return;
    }
    if (!fs.existsSync(globalSCHome)) {
      fs.mkdirSync(globalSCHome);
    }
    request(path, (error, response, body) => {
      fs.writeFileSync(`${globalSCHome}/.swiftlint.yml`, body);
      console.log('全局配置更新成功~'.green);
    });
  }

  /* 如果版本升级，那么需要更新配置 */
  updateConfigIfNeed() {
    if (!this.version) { return; }
    nconf.argv().env().file({ file: scLocalConfig });
    const localVersion = nconf.get('version');
    if (!localVersion || localVersion !== this.version) {
      nconf.set('version', this.version);
      nconf.save();
      this.didUpdate = true;
    }
  }

  /**
   * commit hook的执行入口
   */
  /* eslint-disable camelcase */
  async run_before_commit() {
    await this.excuteLint();
    checkMessage();
  }

  /* cli的入口 */
  async run(strategy = Strategy.COMMIT, inputMsg = null) {
    await checkUpdate();
    // 检查当前所在的目录是否为Git目录
    if (!fs.existsSync(gitHome)) {
      console.error('当前目录非Git目录或者非Git根目录，请切换目录再试~'.red);
      return;
    }
    this.createGlobalDirIfneed();
    await this.createLocalDirIfneed();
    this.buryHooks();
    this.updateConfigIfNeed();
    if (strategy === Strategy.FORMAT) {
      await this.excuteFormat();
      return;
    }
    await this.excuteLint();
    let execution;
    if (inputMsg) {
      execution = `git commit -m '${inputMsg}'`;
      evaluateMessage(inputMsg);
    } else {
      const answers = await inquirer.prompt(commitQuestion);
      const { message, scope, type } = answers;
      if (scope.length !== 0) {
        execution = `git commit -m '${type}: [${scope}] ${message}'`;
      } else {
        execution = `git commit -m '${type}: ${message}'`;
      }
    }
    const handler = (error, stdout, stderr) => {
      if (error) {
        console.log(stderr.red);
        console.log(stdout.red);
      } else {
        console.log(stdout.gray);
      }
    };
    exec(`${execution} --no-verify`, handler);
  }
}

module.exports = Worker;
