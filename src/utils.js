const fs = require('fs');
const checkForUpdate = require('update-check');
const ReadLineSync = require('./readline-sync');
require('colors');

function deleteFolderRecursive(path) {
  if (fs.existsSync(path)) {
    // eslint-disable-next-line
    fs.readdirSync(path).forEach((file, index) => {
      const curPath = `${path}/${file}`;
      if (fs.lstatSync(curPath).isDirectory()) { // recurse
        deleteFolderRecursive(curPath);
      } else { // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(path);
  }
}

function cutfilelines(file, startline, character, reason) {
  const liner = new ReadLineSync();
  liner.open(file);
  let theline;
  let index = 1;
  while (!liner.EOF) {
    theline = liner.next();
    if ((index >= (startline - 3)) && (index <= (startline + 3))) {
      let content = '';
      const isThisLine = (index === startline);
      if (isThisLine) {
        content += `> ${index} | ${theline}\n`.red;
        const spacelegth = `${index}`.length + 5 + character;
        for (let i = 0; i < spacelegth - 1; i++) {
          content += ' ';
        }
        content += '^\n'.red;
        content += reason.red;
      } else {
        content += `${index} | ${theline}`.red;
      }
      console.log(content);
    }
    index += 1;
  }
  liner.close();
}

// 检查版本并且更新提示
async function checkUpdate() {
  let update = null;
  try {
    const pkg = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf8'));
    update = await checkForUpdate(pkg);
  } catch (error) {
    update = false;
  }
  if (update) {
    console.log(`当前的最新版本为【${update.latest}】，为了更好的体验我们建议您升级版本!`.yellow);
  }
}

exports.deleteFolderRecursive = deleteFolderRecursive;
exports.cutfilelines = cutfilelines;
exports.checkUpdate = checkUpdate;
