'use strict';

const assert = require('assert');
const Metric = require('./base');
const Indicator = require('../indicator');
const StepNumber = require('../step_num');

class Counter extends Metric {
  constructor(options = {}) {
    assert(options.step, '[Counter] options.step is required');
    super(options);
    this._value = new StepNumber(0, options.step);
  }

  get count() {
    return this._value.poll();
  }

  measure() {
    const rate = this._value.pollAsRate();
    return new Indicator({
      id: this.id,
      timestamp: this._value.timestamp,
    }).addMeasurement('count', this._value.previous)
      .addMeasurement('rate', rate);
  }

  inc(amount = 1) {
    this._value.current += amount;
  }

  dec(amount = 1) {
    this.inc(-amount);
  }
}

module.exports = Counter;
