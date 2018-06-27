'use strict';

const Id = require('../lib/id');
const NoopId = require('../lib/noop_id');
const assert = require('assert');

describe('test/id.test.js', () => {
  it('should create id ok', () => {
    const id = new Id({ name: 'aa' });
    assert(id.name === 'aa');
    assert(id.tags && id.tags.size === 0);
    assert(id.toString() === 'aa');
  });

  it('should create id withTag ok', () => {
    const id = new Id({ name: 'aa' })
      .withTag('foo', 'bar');
    const id2 = id.withTag('xxx', 'yyy');

    assert(id.name === 'aa');
    assert(id.tags && id.tags.size === 1);
    assert(id.toString() === 'aa?foo=bar');

    assert(id2.name === 'aa');
    assert(id2.tags && id2.tags.size === 2);
    assert(id2.toString() === 'aa?foo=bar&xxx=yyy');
  });

  it('should create id withTags ok', () => {
    const tags = new Map();
    tags.set('xxx', 'yyy');
    tags.set('aaa', 'bbb');
    const id = new Id({ name: 'aa' })
      .withTag('foo', 'bar')
      .withTags(tags);

    assert(id.name === 'aa');
    assert(id.tags && id.tags.size === 3);
    assert(id.toString() === 'aa?aaa=bbb&foo=bar&xxx=yyy');
  });

  it('should support NoopId', () => {
    const id = NoopId.instance;
    assert(id.name === 'noop');
    assert(id.tags && id.tags.size === 0);
    assert(id.withTag() === id);
    assert(id.withTags() === id);
    assert(id.toString() === 'noop');
  });
});
