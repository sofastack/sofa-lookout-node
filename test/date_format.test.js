'use strict';

const mm = require('mm');
const assert = require('assert');

describe('test/date_format.test.js', () => {
  after(mm.restore);

  it('should format date ok', () => {
    mm(Date.prototype, 'getTimezoneOffset', () => -480);
    delete require.cache[require.resolve('../lib/date_format')];
    let DateFormat = require('../lib/date_format');
    assert(DateFormat.format(1529649029265).endsWith('+08:00'));

    mm(Date.prototype, 'getTimezoneOffset', () => 480);
    delete require.cache[require.resolve('../lib/date_format')];
    DateFormat = require('../lib/date_format');
    assert(DateFormat.format(1529649029265).endsWith('-08:00'));
  });
});
