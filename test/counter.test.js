'use strict';

const mm = require('mm');
const Id = require('../lib/id');
const assert = require('assert');
const Counter = require('../lib/metric/counter');

describe('test/counter.test.js', () => {
  beforeEach(() => {
    mm(Date, 'now', () => 0);
  });
  after(mm.restore);

  it('count', () => {
    const id = new Id({ name: 'aa' });
    const counter = new Counter({
      id,
      step: 500,
    });
    counter.inc();
    counter.inc(7);
    counter.dec();
    counter.dec(2);

    mm(Date, 'now', () => 500);

    let str = '';
    for (const m of counter.measure().measurements) {
      console.log(m);
      str += m;
    }
    assert(str.includes('count:5'));
    assert(str.includes('rate:10'));
  });

  it('poll later', () => {
    const id = new Id({ name: 'aa' });
    const counter = new Counter({
      id,
      step: 1000,
    });
    counter.inc();

    mm(Date, 'now', () => 1000); // window 1

    let str = '';
    for (const m of counter.measure().measurements) {
      console.log(m);
      str += m;
    }

    mm(Date, 'now', () => 2000); // window 2

    counter.inc();

    mm(Date, 'now', () => 4000); // window 3-4

    str = '';
    for (const m of counter.measure().measurements) {
      console.log(m);
      str += m;
    }
    console.log(str);
  });
});
