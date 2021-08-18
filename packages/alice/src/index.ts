import debounce from 'lodash/debounce';
import { Calvin } from '@endgame/calvin';
import { Eva } from '@endgame/eva';

import { Detect } from './detect';
import { Speed } from './speed';

export class Alice {
  /**
   * @description The scroll end delay in ms.
   * @static
   * @memberof Alice
   */

  static _scrollEndDelay = 100;

  /**
   * @description Object allowing the use of reactive data. Storing default scroll values before any scroll event.
   * @static
   * @type {Calvin}
   * @memberof Alice
   */

  static _reactor: Calvin = new Calvin({ scrollTop: 0, isScrolling: false });

  /**
   * @description Object allowing to watch view data.
   * @static
   * @type {Eva}
   * @memberof Alice
   */

  static _eva: Eva = new Eva();

  /**
   * @description Object allowing DOM objects detection.
   * @static
   * @type {Detect}
   * @memberof Alice
   */

  static _detect: Detect = new Detect();

  /**
   * @description Object allowing DOM objects detection.
   * @static
   * @type {Speed}
   * @memberof Alice
   */

  static _speed: Speed = new Speed();

  /**
   * @description Boolean ensuring that we can't initialize multiple scroll listeners.
   * @private
   * @memberof Alice
   */

  private _isInitialized = false;

  /**
   * @description Boolean ensuring that we prevent automatic browser scroll on refresh.
   * @private
   * @memberof Alice
   */

  private _refreshScroll = false;

  private _optionsPluginsList: string[] = [];

  /**
   * Creates an instance of Alice.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Alice
   */

  constructor(optionsPluginsList: string[] = []) {
    this._scrollEventHandler = this._scrollEventHandler.bind(this);

    this._optionsPluginsList = optionsPluginsList;
  }

  /**
   * @description Method used to initialize the plugins only when window is loaded.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string[]} pluginsList
   * @returns {void}
   * @memberof Alice
   */

  private _initializePlugins(pluginsList: string[]): void {
    if (!pluginsList.length) {
      return;
    }

    pluginsList.forEach((pluginName) => {
      // NOTE: Mapping dependecies before initialization. It ensures that plugins share the same instances of Alice dependencies.

      if (pluginName === 'detect') {
        Detect._reactor = Alice._reactor;
        Detect._eva = Alice._eva;

        Alice._detect.initialize();
      } else if (pluginName === 'speed') {
        Speed._reactor = Alice._reactor;
        Speed._eva = Alice._eva;

        Alice._speed.initialize();
      } else if (pluginName === 'collant') {
        // this._collant.initialize();
      }
    });
  }

  /**
   * @description Collect scroll values.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Alice
   */

  private _collectEventValues(): void {
    Alice._reactor.data.scrollTop = window.scrollY || window.pageYOffset;
  }

  /**
   * @description Scroll listener handler.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Alice
   */

  private _scrollEventHandler(): void {
    // Prevent automatic browser scroll on refresh
    if (!this._refreshScroll) {
      this._refreshScroll = true;
      return;
    }

    Alice._reactor.data.isScrolling = true;
    this._collectEventValues();

    this._scrollEnd();
  }

  /**
   * @description Scroll end value refresh.
   * @private
   * @memberof Alice
   */
  private _scrollEnd = debounce(() => {
    Alice._reactor.data.isScrolling = false;
  }, Alice._scrollEndDelay);

  /**
   * @description Hooks onto the scroll event.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Alice
   */

  private _attachListeners(): void {
    window.addEventListener('scroll', this._scrollEventHandler, {
      passive: true,
    });
  }

  /**
   * @description Unhooks from the scroll event.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Alice
   */

  private _detachListeners(): void {
    // ⚡ Avoid memory leak
    window.removeEventListener('scroll', this._scrollEventHandler, false);
  }

  /**
   * @description Initializing the scroll reactive data abilities when the window object is defined.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Alice
   */

  public initialize(): void {
    // No multiple init
    // Avoid having multiple listeners at the same time.
    if (this._isInitialized) {
      return;
    }

    this._isInitialized = true;

    // Init viewport values
    Alice._eva.initialize();

    // Register the scroll event
    this._attachListeners();

    // Prepare plugins
    this._initializePlugins(this._optionsPluginsList);
  }

  /**
   * @description Destroying the reactive data object and listeners.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Alice
   */

  public destroy(): void {
    this._detachListeners();

    this._refreshScroll = false;
    this._isInitialized = false;
  }

  /**
   * @description Reactive scroll properties object's getter.
   * @readonly
   * @type {Calvin}
   * @memberof Alice
   */

  get scroll(): Calvin {
    return Alice._reactor;
  }

  /**
   * @description Reactive viewport properties object's getter.
   * @readonly
   * @type {Calvin}
   * @memberof Alice
   */

  get view(): Calvin {
    return Alice._eva.view;
  }

  /**
   * @description HTMLElements in view detector.
   * @readonly
   * @type {Detect}
   * @memberof Alice
   */

  get detect(): Detect {
    return Alice._detect;
  }

  /**
   * @description HTMLELements speed modifier.
   * @readonly
   * @type {Speed}
   * @memberof Alice
   */

  get speed(): Speed {
    return Alice._speed;
  }

  // get collant(): {
  //   return
  // }
}
