const Provider = require('./provider');

class NoneProvider extends Provider {
  languageName() {
    return 'none';
  }

  lint() {}

  desc() {
    return '不使用任何lint工具';
  }
}

module.exports = new NoneProvider();
