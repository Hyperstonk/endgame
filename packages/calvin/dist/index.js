/*!
 * @endgame/calvin v0.0.0 © 2021-2021
 * Spacefold.
 * All Rights Reserved.
 * Repository: https://github.com/Alphability/spacefold
 * Website: https://spacefold.vision
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

class Calvin {
  constructor(data) {
    this._data = {};
    this._watchers = {};
    this._currentDependent = '';
    this._dependencies = {};
    this._computedFunctions = {};
    this._makeReactive(data);
  }
  _makeReactive(data) {
    this._data = new Proxy(data, {
      get: (...args) => {
        const [, property] = args;
        if (this._currentDependent) {
          this._depend(property);
        }
        return Reflect.get(...args);
      },
      set: (...args) => {
        const [target, property, value, receiver] = args;
        if (this._computedFunctions.hasOwnProperty(property)) {
          this._currentDependent = property;
          target[property] = this._computedFunctions[property].call(receiver);
          this._notify(property, target[property]);
        } else {
          target[property] = value;
          this._notify(property, value);
          if (this._dependencies.hasOwnProperty(property)) {
            this._updateDependents(property);
          }
        }
        return true;
      },
    });
  }
  _notify(property, value) {
    if (this._watchers[property] && this._watchers[property].length >= 1) {
      this._watchers[property].forEach((watcher) => watcher(value));
    }
  }
  _depend(property) {
    if (!this._dependencies[property]) {
      this._dependencies[property] = [];
    }
    if (!this._dependencies[property].includes(this._currentDependent)) {
      this._dependencies[property].push(this._currentDependent);
    }
  }
  _updateDependents(property) {
    this._dependencies[property].forEach((dependent) => {
      this._data[dependent] = null;
    });
  }
  _makeComputed(property, computed) {
    if (!this._computedFunctions[property]) {
      this._computedFunctions[property] = [];
    }
    this._computedFunctions[property] = computed;
    this._data[property] = null;
  }
  _observe(property, watcher) {
    if (!this._watchers[property]) {
      this._watchers[property] = [];
    }
    this._watchers[property].push(watcher);
  }
  computed(computedFunctions) {
    for (const property in computedFunctions) {
      if (computedFunctions.hasOwnProperty(property)) {
        this._makeComputed(property, computedFunctions[property]);
      }
    }
  }
  watch(watchers) {
    for (const property in watchers) {
      if (watchers.hasOwnProperty(property)) {
        this._observe(property, watchers[property]);
      }
    }
  }
  get data() {
    return this._data;
  }
}

exports.Calvin = Calvin;
//# sourceMappingURL=index.js.map
