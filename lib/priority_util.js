'use strict';

const PRIORITYS = {
  NORMAL: 'NORMAL',
  HIGH: 'HIGH',
  LOW: 'LOW',
};

exports.resolve = id => {
  let val = id.tags.get('priority');
  if (val) {
    val = val.toUpperCase();
    if (PRIORITYS[val]) return PRIORITYS[val];
  }
  return 'NORMAL';
};
