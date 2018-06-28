'use strict';

class StepNumber {
  constructor(initVal, step) {
    this._initVal = initVal;
    this._step = step;
    this._previousVal = initVal;
    this._currentVal = initVal;
    this._lastInitPos = Math.floor(Date.now() / step);
  }

  _rollCount() {
    const stepTime = Math.floor(Date.now() / this._step);
    const lastInit = this._lastInitPos;
    if (lastInit < stepTime) {
      this._lastInitPos = stepTime;
      const v = this._currentVal;
      this._currentVal = this._initVal;
      this._previousVal = (lastInit === stepTime - 1) ? v : this._initVal;
    }
  }

  get current() {
    this._rollCount();
    return this._currentVal;
  }

  set current(val) {
    this._currentVal = val;
  }

  get previous() {
    return this._previousVal;
  }

  get timestamp() {
    return this._lastInitPos * this._step;
  }

  poll() {
    this._rollCount();
    return this._previousVal;
  }

  pollAsRate() {
    const amount = this.poll();
    const period = this._step / 1000;
    return amount / period;
  }

  toString() {
    return 'StepNumber{init=' + this._initVal + ', previous=' + this._previousVal +
      ', current=' + this._currentVal + ', lastInitPos=' + this._lastInitPos + '}';
  }
}

module.exports = StepNumber;
