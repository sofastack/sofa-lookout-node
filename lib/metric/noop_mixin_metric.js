'use strict';

const NoopId = require('../noop_id');
const Indicator = require('../indicator');
const NoopTimer = require('./noop_timer');
const NoopCounter = require('./noop_counter');
const NoopDistributionSummary = require('./noop_distribution_summary');

exports.instance = {
  get id() {
    return NoopId.instance;
  },
  measure() { return new Indicator({ id: this.id, timestamp: -1 }); },
  counter() { return NoopCounter.instance; },
  timer() { return NoopTimer.instance; },
  distributionSummary() { return NoopDistributionSummary.instance; },
  gauge() { return null; },
};
