'use strict';

const utility = require('utility');
const DateFormat = require('./date_format');

class LookoutMeasurement {
  constructor(timestamp, id) {
    this.tags = {};
    this.values = {};
    this.metas = {
      time: DateFormat.format(timestamp),
      tags: this.tags,
      [id.name]: this.values,
    };
    this.metricId = id;
  }

  addTag(tagName, tagValue) {
    this.tags[tagName] = tagValue;
  }

  containsTag(tagName) {
    return utility.has(this.tags, tagName);
  }

  put(key, value) {
    this.values[key] = value;
  }

  toJSON() {
    return this.metas;
  }

  toString() {
    return JSON.stringify(this.toJSON());
  }

  static from(metric, registry) {
    const indicator = metric.measure();
    const id = metric.id;
    const measurement = new LookoutMeasurement(indicator.timestamp, id);

    for (const m of indicator.measurements.values()) {
      measurement.put(m.name, m.value);
    }

    for (const key of id.tags.keys()) {
      measurement.addTag(key, id.tags.get(key));
    }

    if (registry) {
      for (const key of registry.commonTags.keys()) {
        if (!measurement.containsTag(key)) {
          measurement.addTag(key, registry.getCommonTagValue(key));
        }
      }
    }
    return measurement;
  }
}

module.exports = LookoutMeasurement;
