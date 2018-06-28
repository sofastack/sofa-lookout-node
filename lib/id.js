'use strict';

const assert = require('assert');

class Id {
  constructor(options = {}) {
    assert(options.name, '[Id] options.name is required');
    this._name = options.name;
    this._tags = new Map(options.tags);
    this._fullName = null;
  }

  get name() {
    return this._name;
  }

  get tags() {
    return this._tags;
  }

  withTag(key, value) {
    // 每次都返回全新的 id
    const id = new Id({
      name: this.name,
      tags: this.tags,
    });
    id.tags.set(key, value);
    return id;
  }

  withTags(tags) {
    const id = new Id({
      name: this.name,
      tags: this.tags,
    });
    for (const key of tags.keys()) {
      id.tags.set(key, tags.get(key));
    }
    return id;
  }

  toString() {
    if (!this._fullName) {
      if (this.tags.size) {
        const tags = Array.from(this.tags.keys())
          .sort()
          .map(key => key + '=' + this.tags.get(key))
          .join('&');
        this._fullName = `${this.name}?${tags}`;
      } else {
        this._fullName = `${this.name}`;
      }
    }
    return this._fullName;
  }
}

module.exports = Id;
