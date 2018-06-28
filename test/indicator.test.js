'use strict';

const Id = require('../lib/id');
const assert = require('assert');
const Indicator = require('../lib/indicator');

describe('test/indicator.test.js', () => {
  it('should create indicator ok', () => {
    const id = new Id({ name: 'aa' });
    const indicator = new Indicator({
      id,
      timestamp: 1529915742789,
    });
    assert(indicator.id === id);
    assert(indicator.timestamp === 1529915742789);
    assert(indicator.measurements && indicator.measurements.size === 0);

    indicator.addMeasurement('foo', 'bar');

    assert(indicator.measurements.size === 1);
    const ms = Array.from(indicator.measurements.values())[0];
    assert(ms && ms.name === 'foo' && ms.value === 'bar');
  });

  it('should auto add options.value to measurements', () => {
    const id = new Id({ name: 'aa' });
    const indicator = new Indicator({
      id,
      timestamp: 1529915742789,
      value: 100,
    });
    assert(indicator.id === id);
    assert(indicator.timestamp === 1529915742789);
    assert(indicator.measurements && indicator.measurements.size === 1);
    const ms = Array.from(indicator.measurements.values())[0];
    assert(ms && ms.name === 'value' && ms.value === 100);
  });
});
