# SafeCommit

`SafeCommit`的初衷是规范工程代码风格以及commit风格，与此同时也对开发人员更加的友好和无感知。

## 环境

* 系统环境: Mac OS X
* Node版本: >= 9.9.0

## 快速上手

### 1.安装

#### [Node](https://nodejs.org/)(如果你已经安装`node`可以跳过此节)

你可以通过[Node](https://nodejs.org/)官网直接下载`pkg`来手动安装。

或者也可以通过`brew`来一键安装。

```
brew install node
```

安装完成之后，使用下列的命令查看当前`Node`的版本。

```
node -v
```

#### [npm](https://github.com/npm/cli)（如果你已经安装`npm`可以跳过此节）

```
curl -L https://www.npmjs.com/install.sh | sh
```

#### SafeCommit安装

```
npm install safecommit -g
```

### 2.使用

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
 
 > 注意：如果您习惯使用SourceTree等GUI工具，那么请您在您的项目中至少第一次使用`git sc`进行提交，此后的所有操作都可以在您的GUI工具中进行。

 ![](https://git.souche-inc.com/destiny/safecommit/raw/master/screenshots/gui-report.png)


### 4. 进阶使用

#### 1.重置当前仓库的配置(还原配置)

> 使用该命令可以使得你当前的仓库重置，所有的设定都还原初始。

```
git sc -s
```
或者
```
git sc --reset
```

####  2.配置全局文件

> 如果你希望使用团队统一的配置，将配置文件保存在远程Git仓库中，然后通过下面的命令进行全局配置。
> 配置完成之后，所有的Swift工程都将应用该配置，除非该工程本地存在`.swiftlint.yml`文件。

```
git sc -c <https://example/swiftlint.yml>
```
或者
```
git sc --swift-config <https://example/swiftlint.yml>
```

### 5. 常见问题

#### 1. 无法找到最新的版本号

请尝试下列命令之后再安装:
```
npm config set registry https://registry.npmjs.org/
```

## 贡献

感谢以下开发者的贡献。

* [张斌辉](zhangbinhui@souche.com)
* [刘林儒](liulinru@souche.com)
* [周辉平](zhouhuiping@souche.com)