'use strict';

const Id = require('../lib/id');
const assert = require('assert');
const Gauge = require('../lib/metric/gauge');

describe('test/gauge.test.js', () => {
  it('should ok', () => {
    const id = new Id({ name: 'aa' });
    const gauge = new Gauge({
      id,
      getValue() {
        return 3.75;
      },
    });
    assert(gauge.value === 3.75);

    let str = '';
    for (const m of gauge.measure().measurements) {
      console.log(m);
      str += m;
    }
    assert(str.includes('value:3.75'));
  });
});
