var fs = require('fs')
var Provider = require('./provider');
var color = require('colors');
const { exec } = require('child_process');

class SwiftProvider extends Provider {

    languageName() {
        return "swift"
    }

    lint() {
        return new Promise(resolve => {
            const configPath = `${process.cwd()}/.git/safecommit/.swiftlint.yml`
            if (!fs.existsSync(configPath)) {
                const rule_content = this.genergateRule([
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
                    'force_try'
                ]);
                fs.writeFileSync(configPath, rule_content);
            }
            var lint_excution = '#! /bin/bash\n';
            lint_excution += 'command -v swiftlint >/dev/null 2>&1 || { echo >&2 "请先安装Swiftlint"; exit 1; }\n';
            lint_excution += 'temp_file=$(mktemp)\n';
            lint_excution += 'git ls-files -m  | grep ".swift" > ${temp_file}\n';
            lint_excution += 'git diff --name-only --cached  | grep ".swift" >> ${temp_file}\n';
            lint_excution += 'counter=0\n';
            lint_excution += 'for f in `sort ${temp_file} | uniq`\n';
            lint_excution += 'do\n';
            lint_excution += '    export SCRIPT_INPUT_FILE_${counter}=${f}\n';
            lint_excution += '    counter=`expr $counter + 1`\n';
            lint_excution += 'done \n';
            lint_excution += 'if (( counter > 0 )); then\n';
            lint_excution += '    export SCRIPT_INPUT_FILE_COUNT=${counter}\n';
            lint_excution += `    swiftlint lint --use-script-input-files --reporter "json" --config ${configPath}\n`
            lint_excution += 'fi'
            exec(lint_excution, (error, stdout, stderr) => {
                var json;
                try {
                    json = JSON.parse(stdout);
                } catch (e) {
                    json = [];
                }
                if (json.length == 0) {
                    console.log('🎉 SwiftLint校验已经通过~'.green);
                    resolve();
                    return;
                }
                const reducer = (result, x) => { return result + `${x["file"]}:${x["line"]}:${x["character"]}:${x["reason"]}\n` };
                const content = json.reduce(reducer, '') + '您的提交内容不规范,请修改之后提交，具体规则请移步: https://github.com/github/swift-style-guide';
                console.log(content.red);
                process.exit(1);
            });
        });
    }

    genergateRule(rules) {
        const reducer = (result, current) => `${result}\n  - ${current}`;
        return rules.reduce(reducer, 'whitelist_rules:\n');
    }
}

module.exports = new SwiftProvider()