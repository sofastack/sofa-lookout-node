'use strict';

const mm = require('mm');
const Id = require('../lib/id');
const assert = require('assert');
const Timer = require('../lib/metric/timer');

describe('test/timer.test.js', () => {
  beforeEach(() => {
    mm(Date, 'now', () => 0);
  });
  after(mm.restore);

  it('should ok', () => {
    const id = new Id({ name: 'aa' });
    const timer = new Timer({
      id,
      step: 1000,
    });
    timer.record(100);
    timer.record(200);
    timer.record(300);

    mm(Date, 'now', () => 1000);

    let str = '';
    for (const m of timer.measure().measurements) {
      console.log(m);
      str += m;
    }

    assert(str.includes('elapPerExec:200'));
    assert(str.includes('totalTime:600'));
    assert(str.includes('max:300'));
  });
});
