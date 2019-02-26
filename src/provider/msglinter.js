const fs = require('fs');
require('colors');

function checkMessage() {
  const msgPath = `${process.cwd()}/.git/COMMIT_EDITMSG`;
  const msg = fs.readFileSync(msgPath, 'utf-8').trim();
  const commitRE = /^(revert: )?(feat|fix|polish|docs|style|refactor|perf|test|workflow|ci|chore|types|build)(\(.+\))?: .{1,50}/;
  if (!commitRE.test(msg)) {
    let content = '=======> commit message不符合规范,请参考一下规范\n';
    content += 'feat: 新功能（feature）\n';
    content += 'fix: 修补问题\n';
    content += 'docs: 更新文档\n';
    content += 'refactor: 重构（即不是新增功能，也不是修改bug的代码变动）\n';
    content += 'chore: bump version to ${版本号}\n';
    content += 'test: 增加测试\n';
    content += 'tyle: 格式变更（不影响代码运行的变动)';
    console.log(content.red);
    process.exit(1);
  }
}

module.exports = checkMessage;
