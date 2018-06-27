'use strict';

const NoopId = require('../noop_id');

exports.instance = {
  get id() {
    return NoopId.instance;
  },
  get count() { return 0; },
  inc() {},
  dec() {},
  measure() { return null; },
};
