import debounce from 'lodash/debounce';
import { Calvin } from '@endgame/calvin';

export class Alice {
  /**
   * @description Object allowing the use of reactive data.
   * @private
   * @type {Calvin}
   * @memberof Alice
   */

  private _reactor: Calvin;

  /**
   * @description The scroll end delay in ms.
   * @private
   * @memberof Alice
   */
  private _scrollEndDelay = 100;

  /**
   * Creates an instance of Alice.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Alice
   */
  constructor() {
    this._scrollEventHandler = this._scrollEventHandler.bind(this);

    // Store default window values before any scroll event
    this._reactor = new Calvin({ scrollTop: 0, isScrolling: false });
  }

  /**
   * @description Collect scroll values.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Alice
   */
  private _collectEventValues(): void {
    this._reactor.data.scrollTop = window.scrollY || window.pageYOffset;
  }

  /**
   * @description Scroll listener handler.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Alice
   */
  private _scrollEventHandler(): void {
    this._reactor.data.isScrolling = true;
    this._collectEventValues();
    this._scrollEnd();
  }

  private _scrollEnd = debounce(() => {
    this._reactor.data.isScrolling = false;
  }, this._scrollEndDelay);

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
   * @description Initializing the viewport reactive data abilities when the window object is defined.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Alice
   */
  public initialize(): void {
    // Register the scroll event
    this._attachListeners();

    // Update the reactor viewport data w/ scroll values
    this._collectEventValues();
  }

  /**
   * @description Destroying the reactive data object and listeners.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Alice
   */
  public destroy(): void {
    this._detachListeners();
  }

  /**
   * @description Reeactive properties object's getter.
   * @readonly
   * @type {Calvin}
   * @memberof Alice
   */
  get scroll(): Calvin {
    return this._reactor;
  }
}
