'use strict';

const assert = require('assert');

class Measurement {
  constructor(name, value) {
    this.name = name;
    this.value = value;
  }

  toString() {
    return 'Measurement(' + this.name + ':' + this.value + ')';
  }
}

class Indicator {
  constructor(options = {}) {
    assert(options.id, '[Indicator] options.id is required');
    assert(typeof options.timestamp === 'number', '[Indicator] options.timestamp is required');
    this.options = options;
    this.measurements = new Set();

    if (options.value) {
      this.addMeasurement('value', options.value);
    }
  }

  addMeasurement(name, value) {
    this.measurements.add(new Measurement(name, value));
    return this;
  }

  get id() {
    return this.options.id;
  }

  get timestamp() {
    return this.options.timestamp;
  }
}

module.exports = Indicator;
