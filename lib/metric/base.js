'use strict';

const assert = require('assert');

class Metric {
  constructor(options = {}) {
    assert(options.id, '[Metric] options.id is required');
    this.options = options;
  }

  get id() {
    return this.options.id;
  }

  /* istanbul ignore next */
  measure() {
    throw new Error('not implement');
  }
}

module.exports = Metric;
