'use strict';

const debug = require('debug')('HttpObserver');
const Base = require('sdk-base');
const assert = require('assert');
const snappy = require('snappyjs');
const ReportDecider = require('./report_decider');
const clientIp = require('address').ip();

class HttpObserver extends Base {
  constructor(registry) {
    assert(registry, '[HttpObserver] registry is required');
    super();
    this.registry = registry;
    this.options = registry.options;
    const { agentHost, agentPort, accessToken } = this.options;
    assert(agentHost && agentPort, '[HttpObserver] agentHost & agentPort are required');
    // accessToken should not be empty
    this.accessToken = accessToken || Buffer.from(clientIp).toString('base64');
    this.url = `http://${agentHost}:${agentPort}/datas`;
    this.httpclient = this.options.httpclient || require('urllib');
    this.reportDecider = new ReportDecider();
    this.commonMetadata = {
      app: this.registry.appName,
    };
  }

  get logger() {
    return this.registry.logger;
  }

  get isEnable() {
    if (!this.reportDecider.isPassed) {
      if (this.reportDecider.stillSilent) {
        debug('observer is disable temporarily cause by agent silent order.');
        return false;
      }
      this._request({
        method: 'GET',
        headers: this.commonMetadata,
      });
      return false;
    }
    return this.options.autoPoll;
  }

  update(measures, metadata) {
    if (!this.isEnable) return;
    if (!measures.length) return;

    metadata = Object.assign(metadata, this.commonMetadata);
    debug('>> metrics:\n%j\n', measures);
    const batches = this._getBatches(measures, this.options.reportBatchSize);
    for (const batch of batches) {
      this._reportBatch(batch, metadata);
    }
  }

  _getBatches(ms, batchSize) {
    const batches = [];
    const size = ms.length;
    for (let i = 0; i < size; i += batchSize) {
      const batch = ms.slice(i, Math.min(size, i + batchSize));
      batches.push(batch);
    }
    return batches;
  }

  _reportBatch(measures, metadata) {
    const text = this._buildReportText(measures);
    if (measures.length < this.options.compressThreshold) {
      this._request({
        method: 'POST',
        headers: Object.assign({
          'Content-Type': 'text/plain',
          'Client-Ip': clientIp,
        }, metadata),
        content: text,
        timeout: [ 1000, 1000 ],
      });
    } else {
      let compressed;
      try {
        compressed = snappy.compress(Buffer.from(text));
      } catch (e) {
        e.message = '>>WARNING: snappy compress report msg err:' + e.message;
        this.logger.warn(e);
        compressed = Buffer.alloc(0);
      }
      this._request({
        method: 'POST',
        headers: Object.assign({
          'Content-Type': 'application/octet-stream',
          'Content-Encoding': 'snappy',
          'Client-Ip': clientIp,
        }, metadata),
        content: compressed,
        timeout: [ 1000, 1000 ],
      });
    }
  }

  _processRequestError(err) {
    if (err.name.includes('TimeoutError')) {
      this.registry.counter(
        this.registry.createId('lookout.client.report.fail.count').withTag('err', 'socket_timeout')
      ).inc();
    } else {
      this.registry.counter(this.registry.createId('lookout.client.report.fail.count')).inc();
    }
    err.message = '>>WARNING: report to agent: ' + this.url + ', cause by ' + err.message;
    this.logger.warn(err);
  }

  _processRequestDone(res) {
    if (res.statusCode !== 200) {
      this.reportDecider.markUnpassed();
      const errMsg = res.headers.err || '';
      if (res.statusCode === 401) {
        this.logger.warn('>>WARNING: Unauthorized!msg:%s', errMsg);
      } else if (res.statusCode === 403) {
        this.logger.warn('>>WARNING: Forbidden!msg:%s', errMsg);
      } else if (res.statusCode === 555) {
        this.logger.warn('>>WARNING: agent current limit!msg:%s', errMsg);
      } else {
        this.logger.warn('>>WARNING: report to lookout agent fail!status:%s!msg:%s', res.statusCode, errMsg);
      }
      this.registry.counter(this.registry.createId('lookout.report.fail').withTag('LOW')).inc();

      // change silentTime
      if (res.headers['wait-minutes']) {
        let wait = Number(res.headers['wait-minutes']);
        wait = isNaN(wait) ? -1 : wait;
        this.reportDecider.changeSilentTime(wait);
      }
    } else {
      this.reportDecider.markPassed();
      debug('>> report to lookout agent ok.');
    }
  }

  _request(options = {}) {
    this.registry.counter(
      this.registry.createId('lookout.client.report.count').withTag('mtd', (options.method || 'get').toLowerCase())
    ).inc();
    options.headers = options.headers || {};
    options.headers['X-Lookout-Token'] = this.accessToken;
    this.httpclient.request(this.url, options).then(res => {
      this._processRequestDone(res.res);
    }).catch(err => {
      this._processRequestError(err);
    });
  }

  _buildReportText(measures) {
    let text = '';
    for (const measure of measures) {
      if (text) text += '\t';
      text += measure.toString();
    }
    return text;
  }
}

module.exports = HttpObserver;
