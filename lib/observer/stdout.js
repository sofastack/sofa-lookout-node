'use strict';

class StdoutObserver {
  update(measures) {
    if (measures.length) {
      console.log('===> ', measures.toString());
    }
  }
}

module.exports = StdoutObserver;
