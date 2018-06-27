'use strict';

const assert = require('assert');
const Metric = require('./base');
const Indicator = require('../indicator');

class Gauge extends Metric {
  constructor(options = {}) {
    assert(typeof options.getValue === 'function', '[Gauge] options.getValue is required');
    super(options);
  }

  get value() {
    return this.options.getValue();
  }

  measure() {
    return new Indicator({
      id: this.id,
      timestamp: Date.now(),
      value: this.value,
    });
  }
}

module.exports = Gauge;
