/*!
 * @endgame/eva v0.0.0 © 2021-2021
 * Spacefold.
 * All Rights Reserved.
 * Repository: https://github.com/Alphability/spacefold
 * Website: https://spacefold.vision
 */
'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

const lodash = require('lodash');
const calvin = require('@endgame/calvin');

const RESIZE_END_DELAY = 200;
class Eva {
  constructor() {
    this._dampeningTransitions = false;
    this._resizeEnd = lodash.debounce(() => {
      this._harvestWindowValues();
      document.documentElement.classList.remove('resizing');
      this._dampeningTransitions = false;
    }, RESIZE_END_DELAY);
    this._resizeEventHandler = this._resizeEventHandler.bind(this);
    this._reactor = new calvin.Calvin({ width: 0, height: 0 });
  }
  _harvestWindowValues() {
    this._reactor.data.width = window.innerWidth;
    this._reactor.data.height = window.innerHeight;
  }
  _resizeEventHandler() {
    this._dampTransitions();
    this._resizeEnd();
  }
  _dampTransitions() {
    if (this._dampeningTransitions) {
      return;
    }
    document.documentElement.classList.add('resizing');
    this._dampeningTransitions = true;
  }
  _attachListeners() {
    window.addEventListener('resize', this._resizeEventHandler, {
      passive: true,
    });
  }
  _detachListeners() {
    window.removeEventListener('resize', this._resizeEventHandler, false);
  }
  initialize() {
    this._attachListeners();
    this._harvestWindowValues();
  }
  destroy() {
    this._detachListeners();
  }
  get viewport() {
    return this._reactor;
  }
}

exports.Eva = Eva;
//# sourceMappingURL=index.js.map
