#!/usr/bin/env node
'use strict';
var fs = require('fs');
var colors = require('colors');
var nconf = require('nconf');
var inquirer = require('inquirer');
var swiftProvider = require('./provider/swift-provider');

const cwd = process.cwd();
const home = process.env['HOME'];
const git_home = `${cwd}/.git`;
const sc_home = `${cwd}/.git/safecommit`;
const sc_local_config = `${sc_home}/config.json`;
const global_sc_home = `${home}/.safecommit`;
const global_sc_config = `${global_sc_home}/config.json`;

class Worker {

    constructor() {
        this.providers = [swiftProvider]
    }

    create_global_dir_ifneed() {
        if (fs.existsSync(global_sc_home)) {
            return;
        }
        fs.mkdirSync(global_sc_home, null);
    }

    create_local_dir_ifneed() {
        if (fs.existsSync(sc_home)) {
            nconf.argv().env().file({ file: sc_local_config });
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
        });
    }

    // 执行lint的核心方法
    excute_lint() {
        const language = nconf.get('language');
        const provider = this.providers.filter(x => x.languageName() === language)
        if (provider.length == 0) { 
            console.log('没有发现可用的lint');
            return;
        }
        const excutor = provider[0];
        excutor.lint();
    }

    bury_hooks() {
        const path = `${git_home}/hooks`
        if (!fs.existsSync(path)) {
            fs.mkdirSync(path)
        }
        var content = '#!/usr/bin/env node\n';
        content += `Worker = require('/Users/maru/WorkBench/SafeCommit');\n`;
        content += `worker = new Worker();\n`;
        content += `worker.run();`
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
              name: 'Pepperoni and cheese',
              value: 'PepperoniCheese'
            },
            {
              name: 'All dressed',
              value: 'alldressed'
            },
            {
              name: 'Hawaiian',
              value: 'hawaiian'
            }
        ]
    }

    excute_commit() {
        
    }

    run() {
        // 检查当前所在的目录是否为Git目录
        if (!fs.existsSync(git_home)) {
            console.error('当前目录非Git目录或者非Git根目录，请切换目录再试~'.red);
            return;
        }
        this.create_global_dir_ifneed()
        this.create_local_dir_ifneed()
        this.bury_hooks();
        this.excute_lint()
    }

    run_before_commit() {
        this.excute_lint()
    }
}

const worker = new Worker()
worker.run()

module.exports = Worker;

// var questions = [
//     {
//       type: 'rawlist',
//       name: 'beverage',
//       message: 'You also get a free 2L beverage',
//       choices: ['Pepsi', '7up', 'Coke']
//     }
//   ];
  
//   inquirer.prompt(questions).then(answers => {
//     console.log('\nOrder receipt:');
//     console.log(JSON.stringify(answers, null, '  '));
//   });