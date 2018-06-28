'use strict';

const mm = require('mm');
const Id = require('../lib/id');
const assert = require('assert');
const DistributionSummary = require('../lib/metric/distribution_summary');

describe('test/distribution_summary.test.js', () => {
  beforeEach(() => {
    mm(Date, 'now', () => 0);
  });
  after(mm.restore);

  it('should ok', () => {
    const id = new Id({ name: 'aa' });
    const t = new DistributionSummary({
      id,
      step: 1000,
    });
    assert(t.count === 0);
    assert(t.totalAmount === 0);

    t.record(42);
    mm(Date, 'now', () => 1000);
    assert(t.count === 1);
    assert(t.totalAmount === 42);

    t.record(-42);
    mm(Date, 'now', () => 2000);
    assert(t.count === 0);
    assert(t.totalAmount === 0);

    t.record(42);
    t.record(58);
    mm(Date, 'now', () => 3000);
    assert(t.count === 2);
    assert(t.totalAmount === 100);

    let str = '';
    for (const m of t.measure().measurements) {
      console.log(m);
      str += m;
    }
    assert(str.includes('rate:2'));
    assert(str.includes('totalAmount:100'));
    assert(str.includes('max:58'));
  });
});
