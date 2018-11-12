# sofa-lookout-node
[SOFALookout](https://github.com/alipay/sofa-lookout) Nodejs 客户端

[![NPM version][npm-image]][npm-url]
[![build status][travis-image]][travis-url]
[![Test coverage][codecov-image]][codecov-url]
[![David deps][david-image]][david-url]
[![Known Vulnerabilities][snyk-image]][snyk-url]
[![npm download][download-image]][download-url]

[npm-image]: https://img.shields.io/npm/v/sofa-lookout-node.svg?style=flat-square
[npm-url]: https://npmjs.org/package/sofa-lookout-node
[travis-image]: https://img.shields.io/travis/alipay/sofa-lookout-node.svg?style=flat-square
[travis-url]: https://travis-ci.org/alipay/sofa-lookout-node
[codecov-image]: https://codecov.io/gh/alipay/sofa-lookout-node/branch/master/graph/badge.svg
[codecov-url]: https://codecov.io/gh/alipay/sofa-lookout-node
[david-image]: https://img.shields.io/david/alipay/sofa-lookout-node.svg?style=flat-square
[david-url]: https://david-dm.org/alipay/sofa-lookout-node
[snyk-image]: https://snyk.io/test/npm/sofa-lookout-node/badge.svg?style=flat-square
[snyk-url]: https://snyk.io/test/npm/sofa-lookout-node
[download-image]: https://img.shields.io/npm/dm/sofa-lookout-node.svg?style=flat-square
[download-url]: https://npmjs.org/package/sofa-lookout-node

## 简介

[SOFALookout](https://github.com/alipay/sofa-lookout) 是一个利用多维度的 metrics 对目标系统进行度量和监控的项目。该模块是它的 Nodejs 客户端实现

## 安装

```bash
$ npm install sofa-lookout-node --save
```

## 快速上手

```js
'use strict';

const LookoutRegistry = require('sofa-lookout-node').LookoutRegistry;
const StdoutObserver = require('sofa-lookout-node').Observer.Stdout;

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
```

标准输出
```
===>  {"time":"2018-06-27T22:06:30+08:00","tags":{"foo":"bar","app":"demoApp","ip":"30.23.232.7","host":"gaoxiaochendeMacBook-Pro-2.local","instant":"machine-a"},"http_requests_total":{"count":1,"rate":0.03333333333333333}}
===>  {"time":"2018-06-27T22:06:32+08:00","tags":{"priority":"LOW","app":"demoApp","ip":"30.23.232.7","host":"gaoxiaochendeMacBook-Pro-2.local","instant":"machine-a"},"lookout.scheduler.poller":{"activeThreads.count":0,"activeThreads.rate":0,"taskExecutionTime.elapPerExec":0,"taskExecutionTime.totalTime":0,"taskExecutionTime.max":0,"taskExecutionDelay.elapPerExec":0,"taskExecutionDelay.totalTime":0,"taskExecutionDelay.max":0}}
===>  {"time":"2018-06-27T22:07:00+08:00","tags":{"foo":"bar","app":"demoApp","ip":"30.23.232.7","host":"gaoxiaochendeMacBook-Pro-2.local","instant":"machine-a"},"http_requests_total":{"count":0,"rate":0}}
```

## 关于 ID

Lookout metrics 相比传统的 metrics 库单一维度的信息描述，提供了支持多维度描述的 tags 能力。 Lookout metrics 的唯一标识 Id 类，由 name 和 tags 构成。

```js
const id = registry.createId('rpc.provider.service.stats');
const newId = id.withTag('service', 'com.alipay.demo.demoService')
            .withTag('method', 'sayHi')
            .withTag('protocol', 'tr')
            .withTag('alias', 'group1');
```

### tags

- 通用的 tags，比如：本机 ip，机房等详细会统一附上，不需要单独指定。
- key 必须小写，尽量是字母，数字，下划线； （尤其是运行期的 Counter, Timer, DistributeSummary 这些 metrics）某个类型的 tag 的 values 尽量是稳定不变有限集合，而且 tags 尽量少，防止 metrics 数量超过最大限制！ 比如：rpc 场合 service, method 两个 tag 对应的值是有限较小的； 反例是每次 rpc 调用都有是个独立的 tag-value。 因此，总体原则自定义打 tags 时要尽量少，对应 values 的集合数量尽量小； 专门用途的 TAG 名称: "priority": 表示优先级。
- 系统保留的 tag key 统配格式_*_,以下划线开始，以下划线结束（比如: "\_\_type\_\_" ）。 请不要使用这种格式的 key，可能会被系统覆盖或丢弃

## 可接入的统计( Metric )类型

### Counter 「计数器」

- 场景：方法调用次数；
- 主动汇报的数据包括： count, rate (也就是 qps)；
- 使用方式

```js
const counter = registry.counter(id);
counter.inc(); // +1
counter.dec(); // -1
```

### Timer 「耗时统计器」

- 场景:统计任务，方法耗时；
- 主动汇报的数据包括：elapPerExec (单次执行耗时), total 耗时，Max 耗时,（上报单位：秒）；
- 使用方式

```js
const timer = registry.timer(id);
timer.record(2000); // 单位为毫秒
```

### DistributionSummary 「值分布情况统计器」

- 场景：比如 io 流量；
- 主动汇报的数据包括: count, total(size), max(size)；
- 使用方式:

```js
const summary = registry.distributionSummary(id);
summary.record(1024);
```

### Gauge 「即时数据观察」

- 场景：比如内存值等即时值；
- 主动汇报的数据包括: value； 往注册表中登记新 gauge 时，ID 值相等，注册表继续使用已有的(忽略新的)；

```js
// 第二个参数是一个函数，返回需要观察的值
registry.gauge(id, () => {
  return 0.1;
});
```

### MixinMetric 「上述基本统计 metrics 的混合管理体」

MixinMetric 是 Lookout 特有的，表示多个基本 metrics 的混合体。引入该 Mixin 目的是优化对「同一度量目标」（即测量目标一致，tags 一致）的多测量指标传输和存储效率，比如：同一线程池的各种指标(线程总数，活跃总数，等待队列大小...)。

- 使用方式（比如，对一次服务调用，加入多个测量指标：调用耗时，输入字节，调用次数，输出字节等等）

```js
//1. getOrAdd  MixinMetric
const rpcServiceMetric = registry.minxinMetric(id);

//2. getOrAdd basic component metric to use
const rpcTimer = rpcServiceMetric.timer('perf');
const rpcOutSizeMetric = rpcServiceMetric.distributionSummary('inputSize');
```

## 如何贡献

请告知我们可以为你做些什么，不过在此之前，请检查一下是否有已经[存在的Bug或者意见](https://github.com/alipay/sofa-lookout-node/issues)。

如果你是一个代码贡献者，请参考[代码贡献规范](https://github.com/eggjs/egg/blob/master/CONTRIBUTING.zh-CN.md)。

## 开源协议

[MIT](LICENSE)
