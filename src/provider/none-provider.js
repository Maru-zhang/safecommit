const Provider = require('./provider');

class NoneProvider extends Provider {
  languageName() {
    return 'none';
  }

  lint() {}
}

module.exports = new NoneProvider();
