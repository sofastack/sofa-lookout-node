'use strict';

const assert = require('assert');
const Metric = require('./base');
const Indicator = require('../indicator');

class MixinMetric extends Metric {
  constructor(options = {}) {
    assert(options.registry, '[MixinMetric] options.registry is required');
    super(options);
  }

  get registry() {
    return this.options.registry;
  }

  counter(name) {
    return this.registry.counter(this.registry.createId(name));
  }

  timer(name) {
    return this.registry.timer(this.registry.createId(name));
  }

  distributionSummary(name) {
    return this.registry.distributionSummary(this.registry.createId(name));
  }

  gauge(name, getValue) {
    return this.registry.gauge(this.registry.createId(name), getValue);
  }

  measure() {
    const indicator = new Indicator({
      id: this.id,
      timestamp: Date.now(),
    });

    for (const metric of this.registry.metrics.values()) {
      const idc = metric.measure();
      for (const measure of idc.measurements.values()) {
        const measureName = measure.name === 'value' ?
          metric.id.name :
          metric.id.name + '.' + measure.name;
        indicator.addMeasurement(measureName, measure.value);
      }
    }
    return indicator;
  }
}

module.exports = MixinMetric;
