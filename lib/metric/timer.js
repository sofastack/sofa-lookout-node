'use strict';

const assert = require('assert');
const Metric = require('./base');
const Indicator = require('../indicator');
const StepNumber = require('../step_num');

class Timer extends Metric {
  constructor(options = {}) {
    assert(options.step, '[Timer] options.step is required');
    super(options);
    this._count = new StepNumber(0, options.step);
    this._total = new StepNumber(0, options.step);
    this._max = new StepNumber(0, options.step);
  }

  measure() {
    const indicator = new Indicator({
      id: this.id,
      timestamp: this._count.timestamp,
    });

    const totalTime = this.totalTime;
    const countValue = this.count;
    const epe = countValue <= 0 ? 0 : totalTime / countValue;

    return indicator
      .addMeasurement('elapPerExec', epe)
      .addMeasurement('totalTime', totalTime)
      .addMeasurement('max', this._max.poll());
  }

  get count() {
    return this._count.poll();
  }

  get totalTime() {
    return this._total.poll();
  }

  record(amount) {
    if (amount > 0) {
      this._count.current++;
      this._total.current += amount;
      const curMax = this._max.current;
      this._max.current = curMax < amount ? amount : curMax;
    }
  }
}

module.exports = Timer;
