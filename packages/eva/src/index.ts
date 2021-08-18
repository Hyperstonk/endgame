import debounce from 'lodash/debounce';
import { Calvin } from '@endgame/calvin';

export class Eva {
  /**
   * @description Object allowing the use of reactive data.
   * @private
   * @type {Calvin}
   * @memberof Eva
   */

  private _reactor: Calvin;

  /**
   * @description Boolean used to allow elements resize transitions dampening.
   * @private
   * @memberof Eva
   */
  private _dampeningTransitions = false;

  /**
   * @description The resize end delay in ms.
   * @private
   * @memberof Eva
   */
  private _resizeEndDelay = 200;

  /**
   * Creates an instance of Eva.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Eva
   */
  constructor() {
    this._resizeEventHandler = this._resizeEventHandler.bind(this);

    // Store default window values before any resize event
    this._reactor = new Calvin({ width: 0, height: 0 });
  }

  /**
   * @description Collect window object's values.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Eva
   */
  private _collectWindowValues(): void {
    this._reactor.data.width = window.innerWidth;
    this._reactor.data.height = window.innerHeight;
  }

  /**
   * @description Resize listener handler.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Eva
   */
  private _resizeEventHandler(): void {
    this._dampTransitions();
    this._resizeEnd();
  }

  /**
   * @description Adding a class to the document element when resizing.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @returns {void}
   * @memberof Eva
   */
  private _dampTransitions(): void {
    if (this._dampeningTransitions) {
      return;
    }
    document.documentElement.classList.add('resizing');

    this._dampeningTransitions = true;
  }

  /**
   * @description Handle the resize end with debounce to avoid recalculating window's values too often.
   * @private
   * @memberof Eva
   */
  private _resizeEnd = debounce(() => {
    this._collectWindowValues();

    document.documentElement.classList.remove('resizing');

    this._dampeningTransitions = false;
  }, this._resizeEndDelay);

  /**
   * @description Hooks onto the resize event.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Eva
   */
  private _attachListeners(): void {
    window.addEventListener('resize', this._resizeEventHandler, {
      passive: true,
    });
  }

  /**
   * @description Unhooks from the resize event.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Eva
   */
  private _detachListeners(): void {
    // ⚡ Avoid memory leak
    window.removeEventListener('resize', this._resizeEventHandler, false);
  }

  /**
   * @description Initializing the viewport reactive data abilities when the window object is defined.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Eva
   */
  public initialize(): void {
    // Register the resize event
    this._attachListeners();

    // Update the reactor viewport data w/ window's values
    this._collectWindowValues();
  }

  /**
   * @description Destroying the reactive data object and listeners.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Eva
   */
  public destroy(): void {
    this._detachListeners();
  }

  /**
   * @description Reeactive properties object's getter.
   * @readonly
   * @type {Calvin}
   * @memberof Eva
   */
  get view(): Calvin {
    return this._reactor;
  }
}
