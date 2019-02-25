#!/usr/bin/env node

const { exec } = require('child_process');
require('colors');
const fs = require('fs');
const nconf = require('nconf');
const inquirer = require('inquirer');
const { deleteFolderRecursive } = require('./utils');
const swiftProvider = require('./provider/swift-provider');
const noneProvider = require('./provider/none-provider');
const messageLinter = require('./provider/msglinter');

const cwd = process.cwd();
const home = process.env.HOME;
const gitHome = `${cwd}/.git`;
const scHome = `${cwd}/.git/safecommit`;
const scLocalConfig = `${scHome}/config.json`;
const globalSCHome = `${home}/.safecommit`;

class Worker {
  constructor() {
    this.providers = [swiftProvider, noneProvider];
  }

  createGlobalDirIfneed() {
    if (fs.existsSync(globalSCHome)) {
      return;
    }
    fs.mkdirSync(globalSCHome, null);
  }

  createLocalDirIfneed() {
    return new Promise((resolve) => {
      if (fs.existsSync(scHome)) {
        nconf.argv().env().file({ file: scLocalConfig });
        resolve();
        return;
      }
      fs.mkdirSync(scHome, null);
      nconf.argv().env().file({ file: scLocalConfig });
      const questions = [
        {
          type: 'rawlist',
          name: 'language',
          message: '请选择当前项目所使用的语言',
          choices: this.providers.map(x => x.languageName()),
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
    nconf.argv().env().file({ file: scLocalConfig });
    const language = nconf.get('language');
    const provider = this.providers.filter(x => x.languageName() === language);
    if (provider.length === 0) {
      console.log('没有发现可用的lint');
      return;
    }
    const excutor = provider[0];
    await excutor.lint();
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
    content += '    Worker = require(\'/Users/maru/WorkBench/SafeCommit\');\n';
    content += '    worker = new Worker();\n';
    content += '    worker.run_before_commit();\n';
    content += '} catch (error) {}\n';
    fs.writeFileSync(`${path}/sc-commit-msg.js`, content);
    content = '#!/usr/bin/env bash\n';
    content += 'PATH="/usr/local/bin:$PATH"\n';
    content += 'if [ -f $HOME/.nvm/nvm.sh ]\n';
    content += 'then\n';
    content += '  . $HOME/.nvm/nvm.sh\n';
    content += '  PATH="$HOME/.nvm/versions/node/$(nvm current)/bin:$PATH"\n';
    content += 'fi\n';
    content += 'node ./.git/hooks/sc-commit-msg.js';
    fs.writeFileSync(`${path}/commit-msg`, content);
    fs.chmodSync(`${path}/commit-msg`, '777');
  }

  buildCommitQuestion() {
    return [
      {
        type: 'list',
        name: 'commit-type',
        message: '请选择你所要提交的commit类型',
        choices: [
          {
            name: 'feat: 新功能（feature）',
            value: 'feat',
          },
          {
            name: 'fix: 修补问题',
            value: 'fix',
          },
          {
            name: 'docs: 更新文档',
            value: 'docs',
          },
          {
            name: 'refactor: 重构（即不是新增功能，也不是修改bug的代码变动）',
            value: 'refactor',
          },
          {
            name: 'chore: bump version to [版本号]',
            value: 'chore',
          },
          {
            name: 'test: 增加测试',
            value: 'test',
          },
          {
            name: 'style: 格式变更（不影响代码运行的变动）',
            value: 'style',
          },
        ],
      },
      {
        type: 'input',
        name: 'message',
        message: '请输入commit内容',
        validate: (input) => {
          if (input.length > 0) {
            return true;
          }
          return 'commit内容不得为空';
        },
      },
      {
        type: 'input',
        name: 'module',
        message: '请输入本次commit涉及的模块名,如果无模块名请直接回车~',
        default: '',
      },
    ];
  }

  /* eslint-disable camelcase */
  async run_before_commit() {
    await this.excuteLint();
    messageLinter();
  }

  async run() {
    // 检查当前所在的目录是否为Git目录
    if (!fs.existsSync(gitHome)) {
      console.error('当前目录非Git目录或者非Git根目录，请切换目录再试~'.red);
      return;
    }
    this.createGlobalDirIfneed();
    await this.createLocalDirIfneed();
    this.buryHooks();
    await this.excuteLint();
    const answers = await inquirer.prompt(this.buildCommitQuestion());
    const { module } = answers;
    const { message } = answers;
    const type = answers['commit-type'];
    const handler = (error, stdout, stderr) => {
      if (error) {
        console.log(stderr.red);
        console.log(stdout.red);
      } else {
        console.log(stdout.yellow);
      }
    };
    let execution;
    if (module.length !== 0) {
      execution = `git commit -m '${type}: [${module}] ${message}'`;
    } else {
      execution = `git commit -m '${type}: ${message}'`;
    }
    console.log(`🎯: ${execution}`);
    exec(execution, handler);
  }
}

module.exports = Worker;
