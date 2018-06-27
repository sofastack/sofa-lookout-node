'use strict';

const Base = require('sdk-base');
const PriorityUtil = require('./priority_util');
const LookoutMeasurement = require('./measurement');

class SchedulerPoller extends Base {
  constructor(registry) {
    super();
    this.registry = registry;
    this.isClosed = false;
    this.highMetircs = new Set();
    this.normalMetircs = new Set();
    this.lowMetircs = new Set();
    this.timers = new Map();

    this.registry.on('metric_added', m => { this._addMetric(m); });
    this.registry.on('metric_removed', m => { this._removeMetric(m); });

    const id = this.registry.createId('lookout.scheduler.poller').withTag('priority', 'LOW');
    const mixinMetric = this.registry.mixinMetric(id);
    this.activeCount = mixinMetric.counter('activeThreads');
    this.taskExecutionTime = mixinMetric.timer('taskExecutionTime');
    this.taskExecutionDelay = mixinMetric.timer('taskExecutionDelay');
    this.id = id;
  }

  get logger() {
    return this.registry.logger;
  }

  start() {
    this._pollData('HIGH');
    this._pollData('NORMAL');
    this._pollData('LOW');
  }

  _pollData(priority) {
    const step = this.registry.stepMillis(priority);
    const metadata = { pri: priority };

    this._scheduleAtFixedRate(() => {
      const metrics = this._getMetricSet(priority);
      const measurements = [];
      for (const metric of metrics.values()) {
        measurements.push(LookoutMeasurement.from(metric, this.registry));
      }
      this.emit('update', measurements, metadata);
    }, step);
  }

  _getMetricSet(priority) {
    switch (priority) {
      case 'HIGH':
        return this.highMetircs;
      case 'LOW':
        return this.lowMetircs;
      default:
        return this.normalMetircs;
    }
  }

  _addMetric(metric) {
    const p = PriorityUtil.resolve(metric.id);
    const metrics = this._getMetricSet(p);
    metrics.add(metric);
  }

  _removeMetric(metric) {
    const p = PriorityUtil.resolve(metric.id);
    const metrics = this._getMetricSet(p);
    metrics.delete(metric);
  }

  _scheduleAtFixedRate(fn, period) {
    const initialDelay = this._getInitialDelay(period);
    const start = Date.now();
    let nextExecutionTime = start + initialDelay;

    const task = () => {
      if (!this.isClosed) {
        const start = Date.now();
        try {
          this.activeCount.inc();
          const delay = start - nextExecutionTime;
          this.taskExecutionDelay.record(delay);
          fn();
        } catch (e) {
          e.message = 'task executed failed, caused by ' + e.message;
          this.logger.warn(e);
        } finally {
          this.activeCount.dec();
          const timer = setTimeout(task, period);
          this.timers.set(period, timer);
          const now = Date.now();
          nextExecutionTime = now + period;
          this.taskExecutionTime.record(now - start);
        }
      }
    };
    setTimeout(() => {
      task();
    }, initialDelay);
  }

  _getInitialDelay(stepSize) {
    const now = Date.now();
    const stepStart = Math.floor(now / stepSize) * stepSize;
    const offset = Math.floor(stepSize / 10);

    const delay = now - stepStart;
    if (delay < offset) { // 当前时间过于靠近低边界,则启动延时补偿个10%的的stepSize；
      return delay + offset;
    } else if (delay > stepSize - offset) { // 当前时间过于靠近高边界，那么再收缩10%的stepSize
      return now - stepStart - offset;
    } // 如果距离左右边界距离合适
    return delay;
  }

  close() {
    this.isClosed = true;
    for (const timer of this.timers.values()) {
      clearTimeout(timer);
    }
    this.timers.clear();
    this.highMetircs.clear();
    this.normalMetircs.clear();
    this.lowMetircs.clear();
    this.removeAllListeners();
  }
}

module.exports = SchedulerPoller;
