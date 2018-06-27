'use strict';

const assert = require('assert');
const Metric = require('./base');
const Indicator = require('../indicator');
const StepNumber = require('../step_num');

class DistributionSummary extends Metric {
  constructor(options = {}) {
    assert(options.step, '[DistributionSummary] options.step is required');
    super(options);
    this._count = new StepNumber(0, options.step);
    this._total = new StepNumber(0, options.step);
    this._max = new StepNumber(0, options.step);
  }

  measure() {
    const rate = this._count.pollAsRate();
    const timestamp = this._count.timestamp;

    return new Indicator({
      id: this.id,
      timestamp,
    })
      .addMeasurement('rate', rate)
      .addMeasurement('totalAmount', this._total.pollAsRate())
      .addMeasurement('max', this._max.poll());
  }

  get count() {
    return this._count.poll();
  }

  get totalAmount() {
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

module.exports = DistributionSummary;
