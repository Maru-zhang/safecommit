class provider {
  // 语言名称
  languageName() { return ''; }

  // lint操作
  lint() {}

  // 格式化操作
  format() {
    console.log('当前Linter没有提供自动格式化工具!');
  }

  // 版本升级之后的hook函数
  didUpdate() {}

  // 对该语言的简单说明
  desc() {
    return null;
  }

  // 语言选择项
  chooiceItem() {
    let result = this.languageName();
    if (this.desc()) {
      result += `(${this.desc()})`;
    }
    return result;
  }
}

module.exports = provider;
