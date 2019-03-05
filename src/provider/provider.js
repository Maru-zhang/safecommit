class provider {
  // 语言名称
  languageName() { return ''; }

  lint() {}

  format() {
    console.log('当前Linter没有提供自动格式化工具!');
  }

  didUpdate() {}
}

module.exports = provider;
