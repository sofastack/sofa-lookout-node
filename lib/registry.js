'use strict';

const os = require('os');
const assert = require('assert');
const HttpObserver = require('./observer/http');
const StepRegistry = require('./step_registry');
const SchedulerPoller = require('./scheduler_poller');
const localIp = require('address').ip();

const defaultOptions = {
  fixedStepMillis: -1,
  enable: true,
  agentHost: null,
  agentPort: -1,
  maxMetricNum: 3000,
  reportBatchSize: 1700,
  compressThreshold: 100,
  autoPoll: true,
  ignoreInfo: true,
};

class LookoutRegistry extends StepRegistry {
  constructor(options = {}) {
    assert(options.appName, '[LookoutRegistry] options.appName is required');
    super(Object.assign({}, defaultOptions, options));

    this.commonTags = new Map();
    this._addDefaultCommonTags();

    this.observers = new Set();
    if (options.observer) {
      this.observers.add(options.observer);
    } else {
      this.observers.add(new HttpObserver(this));
    }

    this.poller = new SchedulerPoller(this);
    this.poller.start();
    this.poller.on('update', (ms, metadata) => {
      for (const observer of this.observers.values()) {
        observer.update(ms, metadata);
      }
    });
  }

  get appName() {
    return this.options.appName;
  }

  getCommonTagValue(name) {
    return this.commonTags.get(name);
  }

  setCommonTag(name, value) {
    this.commonTags.set(name, value);
  }

  removeCommonTag(name) {
    this.commonTags.delete(name);
  }

  addObserver(observer) {
    this.observers.add(observer);
  }

  removeObserver(observer) {
    this.observers.delete(observer);
  }

  _addDefaultCommonTags() {
    this.setCommonTag('app', this.appName);
    this.setCommonTag('ip', localIp);
    this.setCommonTag('host', os.hostname());
    if (this.options.zone) {
      this.setCommonTag('zone', this.options.zone);
    }
    if (this.options.instanceId) {
      this.setCommonTag('instanceId', this.options.instanceId);
    }
  }

  close() {
    this.poller.close();
    this.observers.clear();
    this.removeAllListeners();
  }
}

module.exports = LookoutRegistry;
