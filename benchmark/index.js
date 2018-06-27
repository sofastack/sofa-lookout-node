'use strict';

const Benchmark = require('benchmark');
const benchmarks = require('beautify-benchmark');
const suite = new Benchmark.Suite();

const BST = require('../lib/bst');

function case1() {
  let tags = new BST();
  tags = tags.clone();
  tags.set('service', 'com.alipay.demo.demoService');
  tags = tags.clone();
  tags.set('method', 'sayHi');
  tags = tags.clone();
  tags.set('protocol', 'tr');
  tags = tags.clone();
  tags.set('alias', 'group1');
  tags = tags.clone();
  tags.set('abias', 'group2');

  return tags.toArray();
}

function case2() {
  let tags = new Map();
  tags.set('service', 'com.alipay.demo.demoService');
  tags = new Map(tags);
  tags.set('method', 'sayHi');
  tags = new Map(tags);
  tags.set('protocol', 'tr');
  tags = new Map(tags);
  tags.set('alias', 'group1');
  tags = new Map(tags);
  tags.set('abias', 'group2');

  return Array.from(tags.keys()).sort().map(key => ({
    key,
    value: tags.get(key),
  }));
}

console.log(case1());
console.log(case2());


// add tests
suite
  .add('case1', function() {
    case1();
  })
  .add('case2', function() {
    case2();
  })
  .on('cycle', function(event) {
    benchmarks.add(event.target);
  })
  .on('start', function() {
    console.log('\n  node version: %s, date: %s\n  Starting...', process.version, Date());
  })
  .on('complete', function done() {
    benchmarks.log();
  })
  .run({ async: false });

// node version: v8.9.1, date: Fri Nov 24 2017 15:17:01 GMT+0800 (CST)
// Starting...
// 4 tests completed.

// [match] equals     x 4,228,429 ops/sec ±1.43% (82 runs sampled)
// [match] compare    x 4,095,632 ops/sec ±1.10% (84 runs sampled)
// [no match] equals  x 4,524,972 ops/sec ±1.48% (83 runs sampled)
// [no match] compare x 4,133,569 ops/sec ±1.43% (84 runs sampled)
