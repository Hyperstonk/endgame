import throttle from 'lodash/throttle';
import { Eva } from '@endgame/eva';

import { AnyFunction } from './contracts';
import { InputTweenOptions, TweenList, TweenObject } from './contracts/Tween';
import { Tween } from './tween';
import { isInView, getBoundings, getTriggerOffset } from './utils/view';

export class Detect extends Tween {
  /**
   * @description Boolean ensuring that we can't initialize multiple detection plugins.
   * @static
   * @memberof Detect
   */

  static isInitialized = false;

  /**
   * @description Value used to ensure that we compute tweens only 60 times per second.
   * 60FPS = 60 frames per second = 16 ms per frame.
   * @static
   * @memberof Detect
   */

  static _sixtyFpsToMs = 16;

  /**
   * @description Object allowing to watch view data.
   * @static
   * @type {Eva}
   * @memberof Detect
   */

  static _eva: Eva;

  /**
   * @description List of detect tween objects.
   * @private
   * @type {TweenList}
   * @memberof Detect
   */

  private _detectTweensList: TweenList = {};

  /**
   * @description Ensuring that we won't process multiple detect computations on the same element at the same time.
   * @private
   * @memberof Detect
   */

  private _ticking = false;

  /**
   * Creates an instance of Detect.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
   */

  constructor() {
    super();
  }

  /**
   * @description Computing tween in view position.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {TweenObject} tween
   * @memberof Detect
   */

  private async _computeDetection(tween: TweenObject): Promise<void> {
    // If once and already in view we early return.
    if (tween.options.once && tween.state.isInView) {
      return;
    }

    // NOTE: Early returns with if statements without curly brackets allow the browser to parse js. Thus, getBoudingClientRect was calling a style recalculation even if it as not used.

    if (!tween.state.boundings) {
      /**
       * We can't use spread operator
       * because the object returned by getBoundingClientRect
       * is a DOMRect, not a classic object.
       */
      tween.state.boundings = await getBoundings(
        tween.element,
        Detect._reactor.data.scrollTop
      );
    }

    if (!tween.state.triggerOffsetComputed) {
      // Set trigger offset computation to true if the element's detection have been computed once.
      tween.state.triggerOffsetComputed = true;

      tween.options.triggerOffsets = getTriggerOffset(
        tween,
        tween.state.boundings
      );
    }

    const { boundings, coordinates } = tween.state;
    const { triggerOffsets } = tween.options;
    const { height: windowHeight } = Detect._eva.view.data;

    // Computing in view detection for each tween.
    tween.state.isInView = isInView(
      Detect._reactor.data.scrollTop,
      windowHeight,
      triggerOffsets,
      boundings,
      coordinates
    );
  }

  /**
   * @description Loop through tweens to compute them.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Detect
   */

  private _handleTweenList = throttle(async () => {
    if (this._ticking) {
      return;
    }

    // Register scroll tick
    this._ticking = true;

    const detectMeasurementPromises = Object.values(this._detectTweensList).map(
      async (tween) => {
        await this._computeDetection(tween);
      }
    );
    await Promise.all(detectMeasurementPromises);

    /**
     * Reset the tick so we can
     * capture the next scroll event
     */
    this._ticking = false;
  }, Detect._sixtyFpsToMs);

  /**
   * @description Initializing the detection abilities when the window object is defined.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
   */

  public initialize(): void {
    // No multiple init
    if (Detect.isInitialized) {
      return;
    }

    Tween._reactor = Detect._reactor;
    Detect.isInitialized = true;

    Detect._reactor.watch({
      scrollTop: () => {
        this._handleTweenList();
      },
    });
    Detect._eva.view.watch({
      width: (val: number) => {
        if (!val) {
          return;
        }

        // Update tweens positions and specific features.
        this.update();
      },
      outerHeight: (val: number) => {
        if (!val) {
          return;
        }

        // Update tweens positions and specific features.
        this.update();
      },
    });
  }

  /**
   * @description Update tweens positions and specific features.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
   */

  public update(): void {
    // Handling all tweens global reset during resize (debounced by using static method).
    Tween._handleResize();
  }

  /**
   * @description Destroying the tweens.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
   */

  public destroy(): void {
    super._destroy();

    this._detectTweensList = {};
    Detect.isInitialized = false;
  }

  /**
   * @description Adding new tween to the detection list.
   * @author Alphability <albanmezino@gmail.com>
   * @param {HTMLElement} element
   * @param {InputTweenOptions} options
   * @returns {string}
   * @memberof Detect
   */
  public add(element: HTMLElement, options?: InputTweenOptions): string;

  /**
   * @description Adding new tweens to the detection list.
   * @author Alphability <albanmezino@gmail.com>
   * @param {HTMLElement[]} elements
   * @param {InputTweenOptions} options
   * @returns {string[]}
   * @memberof Detect
   */

  public add(elements: HTMLElement[], options?: InputTweenOptions): string[];

  public add(
    elements: HTMLElement | HTMLElement[],
    options: InputTweenOptions = {}
  ): string | string[] {
    const ids = super._add(elements, options);

    // Update detect tweens list after registering a new element
    const idsList = Array.isArray(ids) ? ids : [ids];
    idsList.forEach((id) => {
      this._detectTweensList[id] = Detect._list[id];
    });

    return ids;
  }

  /**
   * @description Allowing us to hook on a specific event.
   * @author Alphability <albanmezino@gmail.com>
   * @param {string} eventName
   * @param {string} id
   * @param {AnyFunction} func
   * @returns {Detect}
   * @memberof Detect
   */

  public on(eventName: string, id: string, func: AnyFunction): Detect;

  /**
   * @description Allowing us to hook on a specific event.
   * @author Alphability <albanmezino@gmail.com>
   * @param {string} eventName
   * @param {string[]} ids
   * @param {AnyFunction} func
   * @returns {Detect}
   * @memberof Detect
   */

  public on(eventName: string, ids: string[], func: AnyFunction): Detect;

  public on(
    eventName: string,
    ids: string | string[],
    func: AnyFunction
  ): Detect {
    const idsList = Array.isArray(ids) ? ids : [ids];
    super._on(eventName, idsList, func);

    return this;
  }

  /**
   * @description Removing tweens by id.
   * @author Alphability <albanmezino@gmail.com>
   * @param {(string | string[])} ids
   * @returns {Detect}
   * @memberof Detect
   */
  public remove(ids: string | string[]): Detect {
    super._remove(ids);

    if (Array.isArray(ids)) {
      ids.forEach((id) => {
        delete this._detectTweensList[id];
      });
    } else {
      // Here ids is considered as a single Catalyst id
      delete this._detectTweensList[ids];
    }

    return this;
  }
}
