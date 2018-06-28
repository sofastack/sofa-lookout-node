'use strict';

const Id = require('./id');
const Base = require('sdk-base');
const assert = require('assert');
const Gauge = require('./metric/gauge');
const Timer = require('./metric/timer');
const NoopTimer = require('./metric/noop_timer');
const Counter = require('./metric/counter');
const NoopCounter = require('./metric/noop_counter');
const MixinMetric = require('./metric/mixin_metric');
const NoopMixinMetric = require('./metric/noop_mixin_metric');
const DistributionSummary = require('./metric/distribution_summary');
const NoopDistributionSummary = require('./metric/noop_distribution_summary');
const PriorityUtil = require('./priority_util');

const defaultOptions = {
  fixedStepMillis: -1,
  enable: true,
  // agentHost: null,
  // agentPort: -1,
  maxMetricNum: 3000,
  // reportBatchSize: 1700,
  // autoPoll: true,
  // ignoreInfo: true,
};

class StepRegistry extends Base {
  constructor(options = {}) {
    assert(options.logger, '[StepRegistry] options.logger is required');
    super(Object.assign({}, defaultOptions, options));

    this.stepMap = options.stepMap || {
      HIGH: 2000, // 2s
      NORMAL: 30000, // 30s
      LOW: 60000, // 1min
    };
    this.metrics = new Map(); // <id, metric>
    this.maxNumWarning = true;
  }

  get logger() {
    return this.options.logger;
  }

  createId(name) {
    return new Id({ name });
  }

  stepMillis(priority) {
    return this.stepMap[priority];
  }

  getStepMillis(id) {
    if (this.options.fixedStepMillis > 0) {
      return this.options.fixedStepMillis;
    }
    return this.stepMillis(PriorityUtil.resolve(id));
  }

  _createIfAbsent(id, delegate) {
    const key = id.toString();
    let m = this.metrics.get(key);
    if (!m) {
      const limit = this.options.maxMetricNum;
      if (this.metrics.size >= limit) {
        if (this.maxNumWarning) {
          this.logger.warn('[LookoutRegistry] metrics number reach max limit: %d! Do not record this new metric(id:%s).', limit, id);
          this.maxNumWarning = false;
        }
        return delegate.noopMetric();
      }
      const step = this.getStepMillis(id);
      m = delegate.apply(id, step);
      this.metrics.set(key, m);
      this.emit('metric_added', m);
    }
    return m;
  }

  removeMetric(id) {
    const key = id.toString();
    const metric = this.metrics.get(key);
    if (metric) {
      this.metrics.delete(key);
      this.emit('metric_removed', metric);
    }
  }

  counter(id) {
    return this._createIfAbsent(id, {
      apply(id, step) {
        return new Counter({ id, step });
      },
      noopMetric() {
        return NoopCounter.instance;
      },
    });
  }

  gauge(id, getValue) {
    return this._createIfAbsent(id, {
      apply(id) {
        return new Gauge({ id, getValue });
      },
      noopMetric() {
        return null;
      },
    });
  }

  timer(id) {
    return this._createIfAbsent(id, {
      apply(id, step) {
        return new Timer({ id, step });
      },
      noopMetric() {
        return NoopTimer.instance;
      },
    });
  }

  mixinMetric(id) {
    const { logger, maxMetricNum, enable } = this.options;
    return this._createIfAbsent(id, {
      apply(id, stepSize) {
        return new MixinMetric({
          id,
          registry: new StepRegistry({
            logger,
            enable,
            maxMetricNum,
            fixedStepMillis: stepSize,
          }),
        });
      },
      noopMetric() {
        return NoopMixinMetric.instance;
      },
    });
  }

  distributionSummary(id) {
    return this._createIfAbsent(id, {
      apply(id, step) {
        return new DistributionSummary({ id, step });
      },
      noopMetric() {
        return NoopDistributionSummary.instance;
      },
    });
  }
}

module.exports = StepRegistry;
