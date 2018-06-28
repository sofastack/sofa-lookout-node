'use strict';

class ReportDecider {
  constructor() {
    this.silentTime = -1;
    this.passed = false;
  }

  get isPassed() {
    return this.passed;
  }

  get stillSilent() {
    return this.silentTime > 0 && Date.now() < this.silentTime;
  }

  changeSilentTime(waitMinutes) {
    if (waitMinutes > 0) {
      const waitTime = waitMinutes * 60 * 1000 + Date.now();
      if (waitTime > this.silentTime) {
        this.silentTime = waitTime;
        this.passed = false;
      }
    }
  }

  markPassed() {
    this.passed = true;
  }

  markUnpassed() {
    this.passed = false;
  }
}

module.exports = ReportDecider;
