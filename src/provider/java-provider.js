var fs = require('fs')
var Provider = require('./provider');
var color = require('colors');
const XmlReader = require('xml-reader');
const { exec } = require('child_process');

const cwd = `${process.cwd()}/`;// 当前工作目录
const jar_git_addr = "git@git.souche-inc.com:liulinru/safecommitjavares.git"; // jar包和配置文件仓库
const checkstyle_jar = "checkstyle-7.0.jar";
const checkstyle_config_File = "checkstyle.xml";
const checkstyle_result_File = "checkstyleResult.xml";

const work_dir = `.git/safecommit/checkstyle/`// lint工作目录
const jar_dir = `${cwd}${work_dir}`; // jar包父目录
const jar_path = `${jar_dir}${checkstyle_jar}`; // jar包地址
const jar_config_path = `${jar_dir}${checkstyle_config_File}`; // 配置文件地址
const jar_check_result_path = `${jar_dir}${checkstyle_result_File}`;// 结果地址

const jar_download_cmd = `git clone ${jar_git_addr} ${jar_dir}jarTempDir`; // 拉取仓库
const jar_mv_cmd = `mv ${work_dir}jarTempDir/* ${work_dir}`; // 将jar包和配置文件移动到工作目录
const jar_rm_cmd = `rm -rf ${work_dir}jarTempDir/`;// 删除临时目录

class JavaProvider extends Provider {

    languageName() {
        return "Java"
    }

    // 从gitlab仓库拉取jar包和配置文件
    downLoadJarRes(){
        return new Promise(resolve => {
            // console.log(`执行`)
            if(!fs.existsSync(jar_path)){
                console.log(`开始下载checkStyle资源`)
                exec(jar_download_cmd, (error, stdout, stderr) => {
                    console.log(stdout);
                    if(error){
                        console.log(`${jar_git_addr} 资源拉取失败\n${error}`)
                        process.exit(1);
                    }else{
                        console.log(`下载完毕`)
                        exec(jar_mv_cmd)
                        exec(jar_rm_cmd)
                    }
                    resolve();
                });
            }else{
                // console.log(`${jar_path}存在`);                
            }
            
        });
    }


    async lint() {

        // 工作资源目录是否存在
        if (!fs.existsSync(jar_dir)) {
            fs.mkdirSync(jar_dir, null);
        }
        if(!fs.existsSync(jar_path)){
            await this.downLoadJarRes();
        }
        // 删除旧的检测结果文件
        if(fs.existsSync(jar_check_result_path)){
            exec(`rm ${jar_check_result_path}`)
        }
        return new Promise(resolve => {
            var lint_excution = '#! /bin/bash\n';
            lint_excution += 'command -v java >/dev/null 2>&1 || { echo >&2 "请先安装Java"; exit 1; }\n'; // 判断java命令是否存在
            lint_excution += 'temp_file=$(mktemp)\n';
            lint_excution += 'git ls-files -m  | grep ".java$" > ${temp_file}\n';
            lint_excution += 'git diff --name-only --cached  | grep ".java$" >> ${temp_file}\n';
            lint_excution += 'counter=0\n';
            lint_excution += 'export SCRIPT_INPUT_FILE="" \n'
            lint_excution += 'for f in `sort ${temp_file} | uniq`\n';
            lint_excution += 'do\n';
            lint_excution += '    export SCRIPT_INPUT_FILE="${SCRIPT_INPUT_FILE} ${f} "\n';
            lint_excution += '    counter=`expr $counter + 1`\n';
            lint_excution += 'done \n';
            lint_excution += 'echo $counter \n';
            lint_excution += 'if (( counter > 0 )); then\n';
            lint_excution += `    java -jar ${jar_path} -f xml -c ${jar_config_path} $SCRIPT_INPUT_FILE > ${jar_check_result_path}\n`
            lint_excution += 'fi'
            // console.info(lint_excution)
            exec(lint_excution, (error, stdout, stderr) => {
                // console.info(stdout)
                if(!error){
                    let resultStr = ''
                    let lintPass = true
                    if(fs.existsSync(jar_check_result_path)){
                        var result = fs.readFileSync(jar_check_result_path,'utf-8')
                        // console.info(`存在文件\n${result}`);
                        var resultObj = XmlReader.parseSync(result);
                        // console.info(resultObj.children[0].children)
                        if(resultObj && resultObj.children && resultObj.children.length > 0){
                            // file 节点
                            for(let index in resultObj.children){
                                 let child = resultObj.children[index]
                                if(child && child.children && child.children.length > 0){
                                    //error节点
                                    for(let subIndex in child.children){
                                        let subChild = child.children[subIndex]
                                        if(subChild && subChild.name === `error`){
                                            // console.info(subChild.attributes)
                                            let errorMsg = subChild.attributes
                                            resultStr += `[${errorMsg.severity}]类${errorMsg.source} ${errorMsg.message}\n`
                                            lintPass = false;
                                        }
                                    }
                                }
                            }
                        }
                        // console.info(resultStr)
                        // 检测没问题
                        if(lintPass){
                            console.log('Java CheckStyle校验已经通过~'.green);
                            resolve();
                        }else{
                            const showInfo = `您的提交内容不规范,存在以下问题,更加详细的报告位于 ${jar_check_result_path}\n`
                            console.log(showInfo)
                            console.log(resultStr.red)
                            process.exit(1);
                        }
                    }else{
                        if(stdout == 0){
                            console.log('Java CheckStyle校验已经通过~'.green);
                            resolve();
                        }else{
                            console.info(`执行异常`)
                            process.exit(1);
                        }
                    }
                }else{
                    console.info(`执行异常\n${error}`)
                    process.exit(1);
                }
            });
        });
    }
}

module.exports = new JavaProvider()