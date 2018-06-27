'use strict';

const mm = require('mm');
const assert = require('assert');
const StepRegistry = require('../lib/step_registry');
const LookoutRegistry = require('../lib/registry');
const StdoutObserver = require('../lib/observer/stdout');
const logger = console;
const observer = new StdoutObserver();

describe('test/registry.test.js', () => {
  let registry;
  before(() => {
    registry = new LookoutRegistry({
      logger,
      observer,
      appName: 'app',
    });
  });
  beforeEach(() => {
    mm(Date, 'now', () => 0);
  });
  afterEach(mm.restore);
  after(() => { registry.close(); });

  it('should create counter ok', () => {
    const id = registry.createId('counter');
    const counter = registry.counter(id);
    counter.inc();
    counter.inc(7);
    counter.dec();
    counter.dec(2);

    mm(Date, 'now', () => 30000);

    let str = '';
    for (const m of counter.measure().measurements) {
      console.log(m);
      str += m;
    }
    assert(str.includes('count:5'));
    assert(str.includes('rate:0.16666666666666666'));
  });

  it('should create gauge ok', () => {
    const id = registry.createId('gauge');
    const gauge = registry.gauge(id, () => 10);

    mm(Date, 'now', () => 30000);

    let str = '';
    for (const m of gauge.measure().measurements) {
      console.log(m);
      str += m;
    }

    assert(str.includes('Measurement(value:10)'));
  });

  it('should create timer ok', () => {
    const id = registry.createId('timer');
    const timer = registry.timer(id);

    timer.record(100);
    timer.record(150);

    mm(Date, 'now', () => 30001);

    let str = '';
    for (const m of timer.measure().measurements) {
      console.log(m);
      str += m;
    }

    assert(str.includes('elapPerExec:125'));
    assert(str.includes('totalTime:250'));
    assert(str.includes('max:150'));
  });

  it('should create distributionSummary ok', () => {
    const id = registry.createId('distributionSummary');
    const summary = registry.distributionSummary(id);

    summary.record(1024);
    summary.record(516);
    summary.record(986);

    mm(Date, 'now', () => 30001);

    let str = '';
    for (const m of summary.measure().measurements) {
      console.log(m);
      str += m;
    }

    assert(str.includes('rate:0.1'));
    assert(str.includes('totalAmount:84.2'));
    assert(str.includes('max:1024'));
  });

  it('should create noop metric if exceed maxMetricNum', () => {
    const registry = new StepRegistry({ logger, maxMetricNum: 1 });

    assert(registry.metrics && registry.metrics.size === 0);

    const counter = registry.counter(registry.createId('counter'));
    assert(registry.metrics.size === 1);
    assert(registry.options.maxMetricNum === 1);

    counter.inc();
    assert(counter.count === 0);

    const noopCounter = registry.counter(registry.createId('counter_1'));
    assert(registry.metrics.size === 1);
    noopCounter.inc();
    noopCounter.inc(7);
    noopCounter.dec();
    noopCounter.dec(2);
    assert(noopCounter.id && noopCounter.id.name === 'noop');
    assert(noopCounter.count === 0);
    assert(noopCounter.measure() == null);

    const noopGauge = registry.gauge(registry.createId('gauge_1'));
    assert(registry.metrics.size === 1);
    assert(noopGauge == null);

    const noopTimer = registry.timer(registry.createId('timer_1'));
    assert(registry.metrics.size === 1);
    noopTimer.record(100);
    noopTimer.record(200);
    assert(noopTimer.id && noopTimer.id.name === 'noop');
    assert(noopTimer.count === 0);
    assert(noopTimer.totalTime === 0);
    assert(noopTimer.measure() == null);

    const noopSummary = registry.distributionSummary(registry.createId('summary_1'));
    assert(registry.metrics.size === 1);
    noopSummary.record(1000);
    noopSummary.record(900);
    assert(noopSummary.id && noopSummary.id.name === 'noop');
    assert(noopSummary.count === 0);
    assert(noopSummary.totalAmount === 0);
    assert(noopSummary.measure() == null);

    const mixinMetric = registry.mixinMetric(registry.createId('mixinMetric_1'));
    assert(registry.metrics.size === 1);
    mixinMetric.counter('a').inc();
    mixinMetric.timer('b').record(100);
    mixinMetric.distributionSummary('c').record(1000);
    assert(mixinMetric.gauge('d') == null);
    assert(mixinMetric.id && mixinMetric.id.name === 'noop');
    assert(mixinMetric.measure().timestamp === -1);

    mm(Date, 'now', () => 30000);
    assert(counter.count === 1);
    assert(noopCounter.count === 0);
    assert(noopTimer.count === 0);
    assert(noopTimer.totalTime === 0);
    assert(noopSummary.count === 0);
    assert(noopSummary.totalAmount === 0);
  });

  it('should removeMetric ok', () => {
    const counterA = registry.counter(registry.createId('counterA').withTag('priority', 'HIGH'));
    counterA.inc(5);
    const counterB = registry.counter(registry.createId('counterA').withTag('priority', 'HIGH'));
    assert(counterA === counterB);
    counterB.dec(2);

    mm(Date, 'now', () => 2001);

    assert(counterA.count === 3);
    assert(counterB.count === 3);

    counterA.inc(3);
    registry.removeMetric(registry.createId('counterA').withTag('priority', 'HIGH'));
    const counterC = registry.counter(registry.createId('counterA').withTag('priority', 'HIGH'));
    counterC.inc(1);

    mm(Date, 'now', () => 4001);

    assert(counterC.count === 1);
  });
});
