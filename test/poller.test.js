'use strict';

const mm = require('mm');
const os = require('os');
const Base = require('sdk-base');
const assert = require('assert');
const LookoutRegistry = require('../lib/registry');
const StdoutObserver = require('../lib/observer/stdout');

class EventObserver extends Base {
  update(ms, metadata) {
    this.emit('update', [ ms, metadata ]);
  }
}

const logger = console;
const observer = new EventObserver();
const localIp = require('address').ip();
const localHost = os.hostname();

describe('test/poller.test.js', () => {
  let registry;
  before(() => {
    registry = new LookoutRegistry({
      logger,
      observer,
      appName: 'app',
      zone: 'zone-x',
      instanceId: 'instance-x',
      stepMap: {
        HIGH: 200,
        NORMAL: 1000,
        LOW: 3000,
      },
    });
    registry.addObserver(new StdoutObserver());
  });
  afterEach(mm.restore);
  after(() => {
    registry.removeObserver(observer);
    registry.close();
  });

  it('empty poll', async function() {
    const hit = new Set();
    let arr;
    do {
      arr = await observer.await('update');
      assert(arr && arr.length === 2);
      hit.add(arr[1].pri);
    } while (hit.size < 3);

    assert(hit.has('HIGH'));
    assert(hit.has('NORMAL'));
    assert(hit.has('LOW'));
  });

  [
    [ 'HIGH', 200 ],
    [ 'NORMAL', 1000 ],
    [ 'LOW', 3000 ],
  ].forEach(item => {
    describe(item[0], () => {
      it('counter', async function() {
        const id = registry.createId('counter').withTag('priority', item[0]);
        const counter = registry.counter(id);
        registry.setCommonTag('foo', 'bar');

        let arr;
        do {
          arr = await observer.await('update');
        } while (arr[1].pri !== item[0]);

        assert(arr[0] && arr[0].length);
        assert(arr[0][0].tags.foo === 'bar');

        counter.inc();
        counter.inc();
        counter.inc();
        counter.dec();

        registry.removeCommonTag('foo');

        do {
          arr = await observer.await('update');
        } while (arr[1].pri !== item[0]);

        const ms = arr[0];
        assert(ms && ms.length);
        const measurement = ms.find(m => m.metricId === id);
        assert(measurement);
        console.log(measurement.toString());
        const json = measurement.toJSON();
        assert.deepEqual(json.counter, {
          count: 2,
          rate: 2 * 1000 / item[1],
        });
        assert.deepEqual(json.tags, {
          priority: item[0],
          app: 'app',
          ip: localIp,
          host: localHost,
          zone: 'zone-x',
          instanceId: 'instance-x',
        });
      });

      it('mixinMetric', async function() {
        const id = registry.createId('mixinMetric').withTag('priority', item[0]);
        const metric = registry.mixinMetric(id);

        let arr;
        do {
          arr = await observer.await('update');
        } while (arr[1].pri !== item[0]);

        metric.distributionSummary('dstest').record(100);
        metric.counter('counttest').inc();
        metric.timer('timertest').record(2000);
        metric.gauge('guagetest', () => 1);

        do {
          arr = await observer.await('update');
        } while (arr[1].pri !== item[0]);

        const ms = arr[0];
        assert(ms && ms.length);
        const measurement = ms.find(m => m.metricId === id);
        assert(measurement);
        console.log(measurement.toString());
        const json = measurement.toJSON();
        assert.deepEqual(json.mixinMetric, {
          'dstest.rate': 1 * 1000 / item[1],
          'dstest.totalAmount': 100 * 1000 / item[1],
          'dstest.max': 100,
          'counttest.count': 1,
          'counttest.rate': 1 * 1000 / item[1],
          'timertest.elapPerExec': 2000,
          'timertest.totalTime': 2000,
          'timertest.max': 2000,
          guagetest: 1,
        });
        assert.deepEqual(json.tags, {
          priority: item[0],
          app: 'app',
          ip: localIp,
          host: localHost,
          zone: 'zone-x',
          instanceId: 'instance-x',
        });
      });
    });
  });

  describe('poll error', () => {
    it('should warn error', async function() {
      let err;
      mm(registry.logger, 'warn', e => {
        err = e;
      });
      registry.addObserver({
        update() {
          throw new Error('mock error');
        },
      });
      await observer.await('update');

      assert(err && err.message === 'task executed failed, caused by mock error');

      await observer.await('update');
    });
  });
});
