'use strict';

const mm = require('mm');
const assert = require('assert');
const StepNumber = require('../lib/step_num');

describe('test/step_num.test.js', () => {
  beforeEach(() => {
    mm(Date, 'now', () => 0);
  });
  after(mm.restore);

  it('empty', () => {
    const v = new StepNumber(0, 10);
    assert(v.current === 0);
    assert(v.poll() === 0);

    assert(v.toString() === 'StepNumber{init=0, previous=0, current=0, lastInitPos=0}');
  });

  it('increment', () => {
    const v = new StepNumber(0, 10);
    v.current++;
    assert(v.current === 1);
    assert(v.poll() === 0);

    assert(v.toString() === 'StepNumber{init=0, previous=0, current=1, lastInitPos=0}');
  });

  it('incrementAndCrossStepBoundary', () => {
    const v = new StepNumber(0, 10);
    // step1-窗口内，中加1
    v.current++;

    mm(Date, 'now', () => 10);
    assert(v.current === 0);
    assert(v.poll() === 1);

    assert(v.toString() === 'StepNumber{init=0, previous=1, current=0, lastInitPos=1}');

    // step2-窗口内:
    mm(Date, 'now', () => 21);
    assert(v.previous === 1);

    assert(v.toString() === 'StepNumber{init=0, previous=1, current=0, lastInitPos=1}');

    // step3-窗口内;由于在step2窗口没有滚动触发，那么到了step3的窗口，则previous就是0了。
    mm(Date, 'now', () => 32);
    v.pollAsRate();
    assert(v.previous === 0);

    assert(v.toString() === 'StepNumber{init=0, previous=0, current=0, lastInitPos=3}');
  });

  it('missedRead', () => {
    const v = new StepNumber(0, 10);
    v.current++;
    mm(Date, 'now', () => 20);
    assert(v.current === 0);
    assert(v.poll() === 0);
  });
});
