const fs = require('fs');
const { exec } = require('child_process');
const Provider = require('./provider');
const { cutfilelines, cliIsInstalled } = require('../utils');
require('colors');

const configPath = `${process.cwd()}/.git/safecommit/.swiftlint.yml`;
const globalConfigPath = `${process.env.HOME}/.safecommit/.swiftlint.yml`;

/* eslint class-methods-use-this: ["error", { "exceptMethods": ["languageName", "lint", "genergateRule"] }] */
class SwiftProvider extends Provider {
  languageName() {
    return 'Swift';
  }

  async lint(autoformat = false) {
    return new Promise((resolve) => {
      cliIsInstalled('swiftlint').then((result) => {
        if (result) {
          this.coreLint(autoformat, resolve);
        } else {
          console.log('请先安装SwiftLint再使用该功能(下载命令：brew install swiftlint)'.red);
          resolve();
        }
      });
    });
  }

  coreLint(autoformat, resolve) {
    const endpointPath = this.fetchEndPointPath();
    let lintExcution = '#! /bin/bash\n';
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
    if (autoformat) {
      lintExcution += `    swiftlint autocorrect --use-script-input-files --config ${endpointPath}\n`;
    } else {
      lintExcution += `    swiftlint lint --use-script-input-files --reporter "json" --config ${endpointPath}\n`;
    }
    lintExcution += 'fi';
    exec(lintExcution, (error, stdout) => {
      if (autoformat) {
        console.log(stdout);
        resolve();
        return;
      }
      let json;
      try {
        json = JSON.parse(stdout).sort((lhs, rhs) => lhs.line > rhs.line);
      } catch (e) {
        json = [];
      }
      if (json.length === 0) {
        console.log('🎉 SwiftLint校验已经通过~'.green);
        resolve();
        return;
      }
      const reducer = (result, x) => `${result}${x.file}:${x.line}:${x.character} ===> [rule: ${x.rule_id}] ${x.reason}\n`;
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
            errorContent += `📌  Reason:  ${item.reason}\n`;
            errorfile = `${item.file}`;
            errorLine = `${item.line}`;
            errorCharacter = `${item.character}`;
          }
          warningCount += 1;
        } else {
          if (errorContent === '') {
            errorContent += `📌  Reason:  ${item.reason}\n`;
            errorfile = `${item.file}`;
            errorLine = `${item.line}`;
            errorCharacter = `${item.character}`;
          }
          errorCount += 1;
        }
      });
      // 截取错误代码片段
      cutfilelines(errorfile, parseInt(errorLine, 0), parseInt(errorCharacter, 0), errorContent);
      console.log(`SwiftLint发现${warningCount + errorCount}处违法代码！请手动修改或者尝试使用"git sc -a"自动格式化，修改完成之后再提交。或者你也可以添加控制注释"// swiftlint:disable <rule1> [<rule2> <rule3>...]"来忽略该规则`.grey);
      console.log('SwiftLint所采用的具体规则请移步: https://github.com/github/swift-style-guide'.grey);
      process.exit(1);
    });
  }

  async format() {
    await this.lint(true);
  }

  didUpdate() {
    const ruleContent = this.genergateDefaultRules();
    fs.writeFileSync(configPath, ruleContent);
    console.log('🔨 SwiftLint配置文件已经更新~'.green);
  }

  /**
   * 获取当前的SwiftLint配置文件路径
   */
  fetchEndPointPath() {
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
    const localConfigPath = `${process.cwd()}/.swiftlint.yml`;
    const localYmlExist = fs.existsSync(localConfigPath);
    return localYmlExist ? localConfigPath : conclusivePath;
  }

  /**
   * 产出一份默认的配置表
   */
  genergateDefaultRules() {
    return this.genergateRule([
      'empty_count',
      'array_init',
      'closure_spacing',
      'vertical_whitespace',
      'compiler_protocol_init',
      'comma',
      'void_return',
      'closing_brace',
      'block_based_kvo',
      'colon',
      'fatal_error_message',
      'vertical_whitespace_closing_braces',
      'vertical_whitespace_between_cases',
      'let_var_whitespace',
      'trailing_whitespace',
      'opening_brace',
    ]);
  }

  genergateRule(rules) {
    let prefixContent = 'trailing_whitespace:\n';
    prefixContent += '  ignores_empty_lines: true\n';
    prefixContent += '  ignores_comments: true\n';
    prefixContent += 'excluded:\n';
    prefixContent += '  - Pods\n';
    prefixContent += '  - Tests\n';
    prefixContent += 'whitelist_rules:';
    const reducer = (result, current) => `${result}\n  - ${current}`;
    return rules.reduce(reducer, prefixContent);
  }
}

module.exports = new SwiftProvider();
