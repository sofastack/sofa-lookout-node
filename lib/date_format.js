'use strict';

let timeZone = '';
let _hourOffset = parseInt(-(new Date().getTimezoneOffset()) / 60, 10);
if (_hourOffset >= 0) {
  timeZone += '+';
} else {
  timeZone += '-';
}
_hourOffset = Math.abs(_hourOffset);
if (_hourOffset < 10) {
  _hourOffset = '0' + _hourOffset;
}
timeZone += _hourOffset + ':00';

function normalizeNum(n) {
  if (n < 10) return '0' + n;
  return '' + n;
}

// ISO8601 formatter for date-time with time zone.
exports.format = d => {
  if (typeof d === 'number') {
    d = new Date(d);
  }
  const date = normalizeNum(d.getDate());
  const month = normalizeNum(d.getMonth() + 1);
  const hours = normalizeNum(d.getHours());
  const mintues = normalizeNum(d.getMinutes());
  const seconds = normalizeNum(d.getSeconds());
  return d.getFullYear() + '-' + month + '-' + date + 'T' +
    hours + ':' + mintues + ':' + seconds + timeZone;
};
