#!/usr/bin/env node
'use strict';
var fs = require('fs');
var colors = require('colors');
var nconf = require('nconf');
var inquirer = require('inquirer');
var swiftProvider = require('./provider/swift-provider');
var javaProvider = require('./provider/java-provider');
var messageLinter = require('./provider/msglinter');
const { exec } = require('child_process');

const cwd = process.cwd();
const home = process.env['HOME'];
const git_home = `${cwd}/.git`;
const sc_home = `${cwd}/.git/safecommit`;
const sc_local_config = `${sc_home}/config.json`;
const global_sc_home = `${home}/.safecommit`;
const global_sc_config = `${global_sc_home}/config.json`;

class Worker {

    constructor() {
        this.providers = [swiftProvider, javaProvider]
    }

    create_global_dir_ifneed() {
        if (fs.existsSync(global_sc_home)) {
            return;
        }
        fs.mkdirSync(global_sc_home, null);
    }

    create_local_dir_ifneed() {
        return new Promise(resolve => {
            if (fs.existsSync(sc_home)) {
                nconf.argv().env().file({ file: sc_local_config });
                resolve()
                return
            }
            fs.mkdirSync(sc_home, null);
            nconf.argv().env().file({ file: sc_local_config });
            var questions = [
                {
                    type: 'rawlist',
                    name: 'language',
                    message: '请选择当前项目所使用的语言',
                    choices: this.providers.map(x => x.languageName())
                }
            ];
            inquirer.prompt(questions).then(answers => {
                nconf.set('language', answers['language'])
                nconf.save()
                resolve()
            });
        });
    }

    // 执行lint的核心方法
    async excute_lint() {
        nconf.argv().env().file({ file: sc_local_config });
        const language = nconf.get('language');
        const provider = this.providers.filter(x => x.languageName() === language)
        if (provider.length == 0) { 
            console.log('没有发现可用的lint');
            return;
        }
        const excutor = provider[0];
        await excutor.lint();
    }

    bury_hooks() {
        const path = `${git_home}/hooks`
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path)
        }
        var content = '#!/usr/bin/env node\n';
        content += `Worker = require('/Users/mmrx/Documents/souche/code/Node/scGitCli');\n`;
        content += `worker = new Worker();\n`;
        content += `worker.run_before_commit();`
        fs.writeFileSync(`${path}/sc-commit-msg.js`, content);
        content = '#!/usr/bin/env bash\n'
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

    build_commit_question() {
        return [
            {
                type: 'list',
                name: 'commit-type',
                message: '请选择你所要提交的commit类型',
                choices: [
                    {
                        name: 'feat: 新功能（feature）',
                        value: 'feat'
                      },
                      {
                        name: 'fix: 修补问题',
                        value: 'fix'
                      },
                      {
                        name: 'docs: 更新文档',
                        value: 'docs'
                      },
                      {
                          name: 'refactor: 重构（即不是新增功能，也不是修改bug的代码变动）',
                          value: 'refactor'
                      },
                      {
                          name: 'chore: bump version to ${版本号}',
                          value: 'chore'
                      },
                      {
                          name: 'test: 增加测试',
                          value: 'test'
                      },
                      {
                          name: 'style: 格式变更（不影响代码运行的变动）',
                          value: 'style'
                      }
                ]
            },
            {
                type: 'input',
                name: 'message',
                message: "请输入commit内容",
                validate: input => {
                    if (input.length > 0) {
                        return true;
                    }
                    return 'commit内容不得为空';
                }
            },
            {
                type: 'input',
                name: 'module',
                message: '请输入本次commit涉及的模块名,如果无模块名请直接回车~',
                default: ''
            }
        ]
    }

    async run_before_commit() {
        await this.excute_lint();
        messageLinter()
    }

    async run() {
        // 检查当前所在的目录是否为Git目录
        if (!fs.existsSync(git_home)) {
            console.error('当前目录非Git目录或者非Git根目录，请切换目录再试~'.red);
            return;
        }
        this.create_global_dir_ifneed();
        await this.create_local_dir_ifneed();
        this.bury_hooks();
        await this.excute_lint();
        const answers = await inquirer.prompt(this.build_commit_question());
        const module = answers['module'];
        const message = answers['message'];
        const type = answers['commit-type'];
        const handler = (error, stdout, stderr) => {
            if (error) {
                console.log(stderr.red);
            } else {
                console.log(stdout.yellow);
            }
        };
        if (module.length != 0) {
            exec(`git commit -m '${type}: [${module}] ${message}'`, handler);
        } else {
            exec(`git commit -m '${type}: ${message}'`, handler);
        }
    }
}

module.exports = Worker;