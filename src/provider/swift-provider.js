const fs = require('fs');
const { exec } = require('child_process');
const Provider = require('./provider');
const { cutfilelines } = require('../utils');
require('colors');

const configPath = `${process.cwd()}/.git/safecommit/.swiftlint.yml`;
const globalConfigPath = `${process.env.HOME}/.safecommit/.swiftlint.yml`;

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["languageName", "lint", "genergateRule"] }] */
class SwiftProvider extends Provider {
  languageName() {
    return 'swift';
  }

  lint() {
    return new Promise((resolve) => {
      let conclusivePath;
      if (!fs.existsSync(configPath)) {
        const ruleContent = this.genergateDefaultRules();
        fs.writeFileSync(configPath, ruleContent);
      }
      if (fs.existsSync(globalConfigPath)) {
        conclusivePath = globalConfigPath;
      } else {
        conclusivePath = configPath;
      }
      const localYmlExist = fs.existsSync(`${process.cwd()}/.swiftlint.yml`);
      let lintExcution = '#! /bin/bash\n';
      lintExcution += 'command -v swiftlint >/dev/null 2>&1 || { echo >&2 "请先安装Swiftlint"; exit 1; }\n';
      lintExcution += 'temp_file=$(mktemp)\n';
      lintExcution += 'git ls-files -m  | grep ".swift$" > ${temp_file}\n';
      lintExcution += 'git diff --name-only --cached  | grep ".swift$" >> ${temp_file}\n';
      lintExcution += 'counter=0\n';
      lintExcution += 'for f in `sort ${temp_file} | uniq`\n';
      lintExcution += 'do\n';
      lintExcution += '    export SCRIPT_INPUT_FILE_${counter}=${f}\n';
      lintExcution += '    counter=`expr $counter + 1`\n';
      lintExcution += 'done \n';
      lintExcution += 'if (( counter > 0 )); then\n';
      lintExcution += '    export SCRIPT_INPUT_FILE_COUNT=${counter}\n';
      if (localYmlExist) {
        lintExcution += `    swiftlint lint --use-script-input-files --reporter "json" --config ${conclusivePath}\n`;
      } else {
        lintExcution += '    swiftlint lint --use-script-input-files --reporter "json"\n';
      }
      lintExcution += 'fi';
      exec(lintExcution, (error, stdout) => {
        let json;
        try {
          json = JSON.parse(stdout);
        } catch (e) {
          json = [];
        }
        if (json.length === 0) {
          console.log('🎉 SwiftLint校验已经通过~'.green);
          resolve();
          return;
        }
        const reducer = (result, x) => `${result}${x.file}:${x.line}:${x.character}:${x.reason}\n`;
        const content = `${json.reduce(reducer, '').replace(/\n$/, '').yellow}`;
        console.log(content);
        // 定位错误
        let errorContent = '';
        let warningCount = 0;
        let errorCount = 0;
        let errorfile = '';
        let errorLine = 0;
        let errorCharacter = 0;
        json.forEach((item) => {
          if (item.severity === 'Warning') {
            if (errorContent === '') {
              errorContent += `Reason:  ${item.reason}\n`;
              errorfile = `${item.file}`;
              errorLine = `${item.line}`;
              errorCharacter = `${item.character}`;
            }
            warningCount += 1;
          } else {
            if (errorContent === '') {
              errorContent += `Reason:  ${item.reason}\n`;
              errorfile = `${item.file}`;
              errorLine = `${item.line}`;
              errorCharacter = `${item.character}`;
            }
            errorCount += 1;
          }
        });
        console.log(errorfile.red);
        // 截取错误代码片段
        cutfilelines(errorfile, parseInt(errorLine, 0), parseInt(errorCharacter, 0), errorContent);
        console.log(`SwiftLint found ${warningCount} warnings, ${errorCount} errors. Please fix them and try 'git sc' again.`.red);
        console.log('您的提交内容不规范,请修改之后提交，具体规则请移步: https://github.com/github/swift-style-guide'.red);
        process.exit(1);
      });
    });
  }

  didUpdate() {
    const ruleContent = this.genergateDefaultRules();
    fs.writeFileSync(configPath, ruleContent);
    console.log('🔨 SwiftLint配置文件已经更新~'.green);
  }

  genergateDefaultRules() {
    return this.genergateRule([
      'empty_count',
      'array_init',
      'closure_spacing',
      'vertical_whitespace',
      'compiler_protocol_init',
      'force_cast',
      'comma',
      'void_return',
      'closing_brace',
      'block_based_kvo',
      'colon',
      'fatal_error_message',
      'force_unwrapping',
      'force_try',
      'vertical_whitespace_closing_braces',
      'vertical_whitespace_opening_braces',
      'vertical_whitespace_between_cases',
      'let_var_whitespace',
      'trailing_whitespace',
      'opening_brace',
    ]);
  }

  genergateRule(rules) {
    const reducer = (result, current) => `${result}\n  - ${current}`;
    return rules.reduce(reducer, 'whitelist_rules:\n');
  }
}

module.exports = new SwiftProvider();
