'use strict';

const empty = new Map();

class NoopId {
  get name() { return 'noop'; }
  get tags() { return empty; }
  withTag() { return this; }
  withTags() { return this; }
  toString() { return this.name; }
}

NoopId.instance = new NoopId();
module.exports = NoopId;
