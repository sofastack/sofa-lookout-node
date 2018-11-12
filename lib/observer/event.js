'use strict';

const EventEmitter = require('events').EventEmitter;

class EventObserver extends EventEmitter {
  update(measures, metadata) {
    this.emit('update', measures, metadata);
  }
}

module.exports = EventObserver;
