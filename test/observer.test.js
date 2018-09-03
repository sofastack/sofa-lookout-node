'use strict';

const mm = require('mm');
const url = require('url');
const http = require('http');
const assert = require('assert');
const snappy = require('snappyjs');
const httpclient = require('urllib');
const awaitEvent = require('await-event');
const sleep = require('mz-modules/sleep');
const LookoutRegistry = require('../lib/registry');
const ReportDecider = require('../lib/observer/report_decider');

const logger = console;

const port = 7200 + Number(process.versions.node.split('.')[0]);

describe('test/observer.test.js', () => {
  afterEach(mm.restore);

  describe('ReportDecider', () => {
    it('should ok', async () => {
      const decider = new ReportDecider();
      assert(!decider.isPassed);
      assert(!decider.stillSilent);

      decider.markPassed();
      assert(decider.isPassed);
      decider.markUnpassed();
      assert(!decider.isPassed);

      decider.markPassed();
      assert(decider.isPassed);

      decider.changeSilentTime(0.01);

      assert(!decider.isPassed);
      assert(decider.stillSilent);
      assert(decider.silentTime > 0);

      await sleep(61);

      assert(decider.stillSilent);

      await sleep(600);

      assert(!decider.stillSilent);
      assert(!decider.isPassed);
    });
  });

  it('http observer poll ok', async () => {
    let statusCode = 200;
    let errMsg = null;
    let waitMinutes = null;
    const server = http.createServer((req, res) => {
      const o = url.parse(req.url);
      console.log(req.method + ' ' + o.pathname);
      console.log('X-Lookout-Token =====>', req.headers['x-lookout-token']);
      assert(req.headers['x-lookout-token']);

      if (o.pathname === '/datas') {
        if (req.method === 'GET') {
          server.emit('healthCheck');
        }
        if (req.method === 'POST') {
          req.on('data', data => {
            server.emit('datas', data);
          });
        }
        errMsg && res.setHeader('Err', errMsg + '');
        waitMinutes && res.setHeader('Wait-Minutes', waitMinutes + '');
        res.writeHead(statusCode, {
          'Content-Type': 'text/plain',
        });
        res.end();
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(port);
    await awaitEvent(server, 'listening');
    console.log('server is ready');

    const registry = new LookoutRegistry({
      logger,
      appName: 'app',
      agentHost: '127.0.0.1',
      agentPort: port,
      httpclient,
      stepMap: {
        HIGH: 200,
        NORMAL: 1000,
        LOW: 3000,
      },
    });

    await awaitEvent(server, 'healthCheck');
    console.log('first healthCheck');

    let buf = await awaitEvent(server, 'datas');
    let str = buf.toString();
    console.log(str);
    let arr = str.split('\t');
    assert(arr.length);

    arr.forEach(item => {
      const o = JSON.parse(item);
      assert(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/.test(o.time));
    });

    statusCode = 401;
    errMsg = 'Not Found';
    waitMinutes = 0.01;

    buf = await awaitEvent(server, 'datas');
    str = buf.toString();
    console.log(str);
    arr = str.split('\t');
    assert(arr.length);

    arr.forEach(item => {
      const o = JSON.parse(item);
      assert(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/.test(o.time));
    });

    statusCode = 403;
    errMsg = 'Forbidden';

    await awaitEvent(server, 'healthCheck');

    statusCode = 555;
    errMsg = 'agent current limit';

    await awaitEvent(server, 'healthCheck');

    statusCode = 500;
    errMsg = 'internal error';

    await awaitEvent(server, 'healthCheck');

    statusCode = 200;
    errMsg = null;
    waitMinutes = null;

    await awaitEvent(server, 'healthCheck');

    buf = await awaitEvent(server, 'datas');
    str = buf.toString();
    console.log(str);
    arr = str.split('\t');
    assert(arr.length);

    arr.forEach(item => {
      const o = JSON.parse(item);
      assert(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/.test(o.time));
    });

    mm(registry.logger, 'warn', e => {
      server.emit('server_error', e);
    });
    mm(httpclient, 'request', (url, options, cb) => {
      cb(new Error('mock error'));
    });

    let err = await awaitEvent(server, 'server_error');
    assert(err.message.includes('mock error'));

    mm(httpclient, 'request', (url, options, cb) => {
      const err = new Error('timeout');
      err.name = 'TimeoutError';
      cb(err);
    });

    err = await awaitEvent(server, 'server_error');
    assert(err.message.includes('timeout'));

    registry.close();
    server.close();
    await awaitEvent(server, 'close');
  });

  it('should compress if measure exteed limit', async function() {
    const server = http.createServer((req, res) => {
      const o = url.parse(req.url);
      if (o.pathname === '/datas') {
        if (req.method === 'GET') {
          server.emit('healthCheck');
        }
        if (req.method === 'POST') {
          if (req.headers['content-length'] === '0') {
            server.emit('datas', Buffer.alloc(0));
          } else {
            req.on('data', data => {
              server.emit('datas', data);
            });
          }
        }
        res.writeHead(200, {
          'Content-Type': 'text/plain',
        });
        res.end();
      } else {
        res.writeHead(404);
        res.end();
      }
    });
    server.listen(port);
    await awaitEvent(server, 'listening');

    const registry = new LookoutRegistry({
      logger,
      appName: 'app',
      agentHost: '127.0.0.1',
      agentPort: port,
      compressThreshold: 5,
      stepMap: {
        HIGH: 200,
        NORMAL: 1000,
        LOW: 3000,
      },
    });

    [ 'HIGH', 'NORMAL', 'LOW' ].forEach(pri => {
      registry.counter(registry.createId('aa').withTag('priority', pri)).inc();
      registry.counter(registry.createId('bb').withTag('priority', pri)).inc();
      registry.counter(registry.createId('cc').withTag('priority', pri)).inc();
      registry.counter(registry.createId('dd').withTag('priority', pri)).inc();
      registry.counter(registry.createId('ee').withTag('priority', pri)).inc();
    });

    const buf = await awaitEvent(server, 'datas');
    const data = snappy.uncompress(buf);
    console.log(data.toString());
    const arr = data.toString().split('\t');
    assert(arr.length);

    arr.forEach(item => {
      const o = JSON.parse(item);
      assert(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}/.test(o.time));
    });

    mm(snappy, 'compress', () => {
      throw new Error('compress error');
    });

    let zero;
    do {
      zero = await awaitEvent(server, 'datas');
    } while (zero && zero.length !== 0);

    registry.close();
    server.close();
    await awaitEvent(server, 'close');
  });
});
