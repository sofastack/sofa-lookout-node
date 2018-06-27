'use strict';

const LookoutRegistry = require('../').LookoutRegistry;
const StdoutObserver = require('../').StdoutObserver;

const logger = console;
// 为了方便演示，这里将 metric 输出到标准输出
// 若不传 observer，默认是走 http 上报服务端
const observer = new StdoutObserver();

const registry = new LookoutRegistry({
  observer,
  logger,
  appName: 'demoApp',
});

// 添加公共 tag
registry.setCommonTag('instant', 'machine-a');

// id 是用来标识一个 metric 的，它包含 name 和 tags 两部分
// 注意：每次调用 withTag 返回的都是一个全新的 id 对象
const id = registry.createId('http_requests_total').withTag('foo', 'bar');

// 创建 counter 类型 metric
const counter = registry.counter(id);
counter.inc();
