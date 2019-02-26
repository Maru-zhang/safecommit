# SafeCommit

`SafeCommit`的初衷是规范工程代码风格以及commit风格，与此同时也对开发人员更加的友好和无感知。

## 环境

* 系统环境: Mac OS X
* Node版本: >= 9.9.0

## 快速上手

### 1.安装

```
npm install safecommit -g
```

### 2.使用

> 注意：如果您习惯使用SourceTree等GUI工具，那么请您在您的项目中至少第一次使用`git sc`进行提交，此后的所有操作都可以在您的GUI工具中进行。

当您想使用`git commit`操作的时候，请使用`git sc`进行替代。

### 3.使用步骤

1. 选择当前仓库的语言环境

![](https://git.souche-inc.com/destiny/safecommit/raw/master/screenshots/demo-1.png)

2. 如果存在违反lint的代码，那么根据不同的语言环境将会输出不同的提示

![](https://git.souche-inc.com/destiny/safecommit/raw/master/screenshots/demo-2.png)

3. 代码都符合规范，那么会提示本次提交的相关信息

![](https://git.souche-inc.com/destiny/safecommit/raw/master/screenshots/demo-3.png)

4. 最后提交成功

![](https://git.souche-inc.com/destiny/safecommit/raw/master/screenshots/demo-4.png)
 