'use strict';

exports.LookoutRegistry = require('./lib/registry');

// backward compatible
exports.HttpObserver = require('./lib/observer/http');
exports.StdoutObserver = require('./lib/observer/stdout');

exports.Observer = {
  HTTP: exports.HttpObserver,
  Stdout: exports.StdoutObserver,
  Event: require('./lib/observer/event'),
};
