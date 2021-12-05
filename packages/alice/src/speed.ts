import throttle from 'lodash/throttle';
import { Eva } from '@endgame/eva';

import { AnyFunction } from './contracts';
import { InputTweenOptions, TweenList, TweenObject } from './contracts/Tween';
import { Tween } from './tween';
import { isInView, getBoundings, getTriggerOffset } from './utils/view';
import {
  applyTransform,
  clearTransform,
  lerpCoordinates,
} from './utils/transform';

export class Speed extends Tween {
  /**
   * @description Boolean ensuring that we can't initialize multiple speed plugins.
   * @static
   * @memberof Speed
   */

  static isInitialized = false;

  /**
   * @description Value used to ensure that we compute tweens only 60 times per second.
   * 60FPS = 60 frames per second = 16 ms per frame.
   * @static
   * @memberof Speed
   */

  static _sixtyFpsToMs = 16;

  /**
   * @description Object allowing to watch view data.
   * @static
   * @type {Eva}
   * @memberof Speed
   */

  static _eva: Eva;

  /**
   * @description List of speed tween objects.
   * @private
   * @type {TweenList}
   * @memberof Speed
   */

  private _speedTweensList: TweenList = {};

  /**
   * @description Ensuring that we won't process multiple speed computations on the same element at the same time.
   * @private
   * @memberof Speed
   */

  private _ticking = false;

  /**
   * @description Ensuring that we'll complete lerp transformations even if the user is not scrolling anymore.
   * @private
   * @memberof Speed
   */

  private _lerpDone = true;

  /**
   * Creates an instance of Speed.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Speed
   */

  constructor() {
    super();
  }

  /**
   * @description Computing tween in view position.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {TweenObject} tween
   * @returns {Promise<void>}
   * @memberof Speed
   */

  private async _computeDetection(tween: TweenObject): Promise<void> {
    // NOTE: Early returns with if statements without curly brackets allow the browser to parse js. Thus, getBoudingClientRect was calling a style recalculation even if it was not used.

    if (!tween.state.boundings) {
      /**
       * We can't use spread operator
       * because the object returned by getBoundingClientRect
       * is a DOMRect, not a classic object.
       */
      tween.state.boundings = await getBoundings(
        tween.element,
        Speed._reactor.data.scrollTop
      );
    }

    const { boundings, coordinates } = tween.state;
    const { height: windowHeight } = Speed._eva.view.data;

    // If not once or not already in view.
    if (!tween.options.once || !tween.state.isInView) {
      if (!tween.state.triggerOffsetComputed) {
        // Set trigger offset computation to true if the element's detection have been computed once.
        tween.state.triggerOffsetComputed = true;

        tween.options.triggerOffsets = getTriggerOffset(
          tween,
          tween.state.boundings
        );
      }

      const { triggerOffsets } = tween.options;

      // Computing in view detection for each tween.
      tween.state.isInView = isInView(
        Speed._reactor.data.scrollTop,
        windowHeight,
        triggerOffsets,
        boundings,
        coordinates
      );
    }

    // Computing in view detection for speed computations.
    tween.state.isInSpeedView = isInView(
      Speed._reactor.data.scrollTop,
      windowHeight,
      // Not considering the trigger offset to stop applying speed when the element is really out of view.
      [0, 0],
      boundings,
      coordinates
    );
  }

  /**
   * @description Computing element speed position.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {TweenObject} tween
   * @returns {Promise<void>}
   * @memberof Speed
   */

  private async _computeSpeed(tween: TweenObject): Promise<void> {
    if (!tween.state.isInSpeedView) {
      return;
    }

    const {
      element,
      options: { lerpAmount, speedAmount },
      state: { boundings },
    } = tween;

    if (!boundings) {
      return;
    }

    // Normal position when the element is at the center of the window
    const { height: windowHeight } = Speed._eva.view.data;
    const scrollMiddle = Speed._reactor.data.scrollTop + windowHeight / 2;
    const tweenMiddle = boundings.y + boundings.height / 2;

    // Computing the transform value and applying it to the element.
    const transformValue = (scrollMiddle - tweenMiddle) * speedAmount;
    tween.state.coordinates = await lerpCoordinates(element, lerpAmount, {
      x: 0,
      y: transformValue,
    });

    // Checking if the lerp is done.
    tween.state.lerpDone =
      !lerpAmount || Math.abs(transformValue - tween.state.coordinates.y) <= 1;
  }

  /**
   * @description Applying the computed speed position to the element.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {TweenObject} tween
   * @returns {void}
   * @memberof Speed
   */
  private async _applySpeed(tween: TweenObject): Promise<void> {
    const {
      element,
      state: { isInSpeedView, coordinates },
    } = tween;

    if (!isInSpeedView) {
      return;
    }

    await applyTransform(element, coordinates);
  }

  /**
   * @description Loop through tweens to compute them.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Speed
   */

  private _handleTweenList = throttle(async () => {
    if (this._ticking) {
      return;
    }

    // Register scroll tick
    this._ticking = true;

    const speedTweensArray = Object.values(this._speedTweensList);

    const speedMeasurementPromises = speedTweensArray.map(async (tween) => {
      await this._computeDetection(tween);
      await this._computeSpeed(tween);
    });
    await Promise.all(speedMeasurementPromises);

    this._lerpDone = !speedTweensArray.filter(({ state }) => !state.lerpDone)
      .length;

    const speedMutationPromises = speedTweensArray.map(async (tween) => {
      await this._applySpeed(tween);
    });
    await Promise.all(speedMutationPromises);

    /**
     * Reset the tick so we can
     * capture the next scroll event
     */
    this._ticking = false;

    if (!this._lerpDone) {
      // While we're not done lerping we restart the handler
      this._handleTweenList();
    }
  }, Speed._sixtyFpsToMs);

  /**
   * @description Handling tweens specific features when window resizes.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @memberof Speed
   */

  private _handleSpeedResize(): void {
    Object.values(this._speedTweensList).forEach((tween) => {
      clearTransform(tween.element);
    });
  }

  /**
   * @description Initializing the speed abilities when the window object is defined.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Speed
   */

  public initialize(): void {
    // No multiple init
    if (Speed.isInitialized) {
      return;
    }

    Tween._reactor = Speed._reactor;
    Speed.isInitialized = true;

    Speed._reactor.watch({
      scrollTop: () => {
        this._handleTweenList();
      },
    });
    Speed._eva.view.watch({
      width: (val) => {
        if (!val) {
          return;
        }

        // Update tweens positions and specific features.
        this.update();
      },
      outerHeight: (val) => {
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
   * @memberof Speed
   */

  public update(): void {
    // Clear transforms before cleaning tweens
    this._handleSpeedResize();

    // Handling all tweens global reset during resize (debounced by using static method).
    Tween._handleResize();
  }

  /**
   * @description Destroying the tweens.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Speed
   */

  public destroy(): void {
    super._destroy();

    this._speedTweensList = {};
    Speed.isInitialized = false;
  }

  /**
   * @description Adding new tween to the detection list.
   * @author Alphability <albanmezino@gmail.com>
   * @param {HTMLElement} element
   * @param {InputTweenOptions} options
   * @returns {string}
   * @memberof Speed
   */

  public add(element: HTMLElement, options?: InputTweenOptions): string;

  /**
   * @description Adding new tweens to the detection list.
   * @author Alphability <albanmezino@gmail.com>
   * @param {HTMLElement[]} elements
   * @param {InputTweenOptions} options
   * @returns {string[]}
   * @memberof Speed
   */

  public add(elements: HTMLElement[], options?: InputTweenOptions): string[];

  public add(
    elements: HTMLElement | HTMLElement[],
    options: InputTweenOptions = {}
  ): string | string[] {
    const ids = super._add(elements, options);

    // Update speed tweens list after registering a new element
    const idsList = Array.isArray(ids) ? ids : [ids];
    idsList.forEach((id) => {
      this._speedTweensList[id] = Speed._list[id];
    });

    return ids;
  }

  /**
   * @description Allowing us to hook on a specific event.
   * @author Alphability <albanmezino@gmail.com>
   * @param {string} eventName
   * @param {string} id
   * @param {AnyFunction} func
   * @returns {Speed}
   * @memberof Speed
   */

  public on(eventName: string, id: string, func: AnyFunction): Speed;

  /**
   * @description Allowing us to hook on a specific event.
   * @author Alphability <albanmezino@gmail.com>
   * @param {string} eventName
   * @param {string[]} ids
   * @param {AnyFunction} func
   * @returns {Speed}
   * @memberof Speed
   */

  public on(eventName: string, ids: string[], func: AnyFunction): Speed;

  public on(
    eventName: string,
    ids: string | string[],
    func: AnyFunction
  ): Speed {
    const idsList = Array.isArray(ids) ? ids : [ids];
    super._on(eventName, idsList, func);

    return this;
  }

  /**
   * @description Removing tweens by id.
   * @author Alphability <albanmezino@gmail.com>
   * @param {(string | string[])} ids
   * @returns {Speed}
   * @memberof Speed
   */
  public remove(ids: string | string[]): Speed {
    super._remove(ids);

    if (Array.isArray(ids)) {
      ids.forEach((id) => {
        delete this._speedTweensList[id];
      });
    } else {
      // Here ids is considered as a single speed tween id
      delete this._speedTweensList[ids];
    }

    return this;
  }
}
