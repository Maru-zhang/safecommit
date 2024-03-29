const fs = require('fs');
const { exec } = require('child_process');
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
        content += `> ${index} | ${theline}\n`.grey;
        const spacelegth = `${index}`.length + 5 + character;
        // eslint-disable-next-line no-plusplus
        for (let i = 0; i < spacelegth - 1; i++) {
          content += ' ';
        }
        content += '^\n'.yellow;
        content += reason.yellow;
      } else {
        content += `${index} | ${theline}`.grey;
      }
      console.log(content);
    }
    index += 1;
  }
  liner.close();
}

async function cliIsInstalled(name) {
  return new Promise((resolve) => {
    exec(`which ${name}`, (error, stdout) => {
      if (error) {
        resolve(false);
        return;
      }
      if (stdout.includes('not found')) {
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
}

// 检查版本并且更新提示
async function checkUpdate() {
  let update = null;
  try {
    const pkg = JSON.parse(fs.readFileSync(`${__dirname}/../package.json`, 'utf8'));
    update = await checkForUpdate(pkg, {
      interval: 3600000 * 3,
      distTag: 'latest',
    });
  } catch (error) {
    update = false;
  }
  if (update) {
    console.log(`当前的最新版本为【${update.latest}】，为了更好的体验我们建议您升级版本！(npm update -g safecommit)`.yellow);
  }
}

function jsUcfirst(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

exports.deleteFolderRecursive = deleteFolderRecursive;
exports.cutfilelines = cutfilelines;
exports.checkUpdate = checkUpdate;
exports.jsUcfirst = jsUcfirst;
exports.cliIsInstalled = cliIsInstalled;
