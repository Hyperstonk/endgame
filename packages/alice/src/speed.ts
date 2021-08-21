import throttle from 'lodash/throttle';
import fastdomCore from 'fastdom';
import fastdomPromised from 'fastdom/extensions/fastdom-promised';
import { Eva } from '@endgame/eva';

import { AnyFunction } from './contracts';
import {
  InputTweenOptions,
  TweenList,
  TweenObject,
  TweenOptions,
} from './contracts/Tween';
import { Tween } from './tween';
import { isInView, getBoundings } from './utils/view';
import {
  applyTransform,
  clearTransform,
  lerpCoordinates,
} from './utils/transform';

// fastdom extension
const fastdom = fastdomCore.extend(fastdomPromised);

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
   * @description Ensuring that we won't process multiple speed computations at the same time.
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
    // NOTE: Early returns with if statements without curly brackets allow the browser to parse js. Thus, getBoudingClientRect was calling a style recalculation even if it as not used.

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
    const { triggerOffset } = tween.options;
    const { height: windowHeight } = Speed._eva.view.data;

    // Computing in view detection for each tween.
    tween.state.isInView = isInView(
      Speed._reactor.data.scrollTop,
      windowHeight,
      triggerOffset,
      boundings,
      coordinates
    );
  }

  /**
   * @description Computing element speed position.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {TweenObject} tween
   * @returns {void}
   * @memberof Speed
   */

  private _computeSpeed(tween: TweenObject): void {
    if (!tween.state.isInView) {
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
    const scrollMiddle = Speed._reactor.data.scrollTop + window.innerHeight / 2;
    const tweenMiddle = boundings.y + boundings.height / 2;

    // Computing the transform value and applying it to the element.
    const transformValue = (scrollMiddle - tweenMiddle) * speedAmount;
    tween.state.coordinates = lerpCoordinates(element, lerpAmount, {
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
   * @returns {Promise<void>}
   * @memberof Speed
   */
  private async _applySpeed(tween: TweenObject): Promise<void> {
    const {
      element,
      state: { isInView, coordinates },
    } = tween;

    if (!isInView) {
      return;
    }

    await fastdom.mutate(() => {
      applyTransform(element, coordinates);
    });
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

    const speedTweensArray = Object.values(this._speedTweensList);

    // Register scroll tick
    this._ticking = true;

    speedTweensArray.forEach((tween) => {
      this._computeDetection(tween);
      this._computeSpeed(tween);
    });

    this._lerpDone = !speedTweensArray.filter(({ state }) => !state.lerpDone)
      .length;

    const speedMutationPromises = speedTweensArray.map(
      async (tween) => await this._applySpeed(tween)
    );

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

  private _handleSpeedResize(): void {
    /**
     * ⚡ Avoid memory leak
     * Early return if there is no items to detect.
     */
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

        this._handleResize();
        this._handleSpeedResize();
      },
      height: (val) => {
        if (!val) {
          return;
        }

        this._handleResize();
        this._handleSpeedResize();
      },
    });
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
   * @description Adding new tweens to the detection list.
   * @author Alphability <albanmezino@gmail.com>
   * @param {(any | any[])} elements
   * @param {InputTweenOptions} { speed = 0, lerp = 0, ...otherOptions }
   * @returns {(string | string[])}
   * @memberof Speed
   */

  public add(
    elements: any | any[],
    { speed = 0, lerp = 0, ...otherOptions }: InputTweenOptions
  ): string | string[] {
    const options = <TweenOptions>{
      ...otherOptions,
      lerpAmount: lerp * 0.1,
      speedAmount: speed * 0.1,
    };

    const ids = super._add(<HTMLElement | HTMLElement[]>elements, options);

    // Update detect tweens list after registering a new element
    const idsList = Array.isArray(ids) ? ids : [ids];
    idsList.forEach((id) => {
      this._speedTweensList[id] = Speed._list[id];
    });

    return ids;
  }

  /**
   * @description Allowing us to hook on a specific event.
   * @author Alphability <albanmezino@gmail.com>
   * @param {...[eventName: string, ids: string[], func: AnyFunction]} args
   * @returns {Speed}
   * @memberof Speed
   */
  public on(
    ...args: [eventName: string, ids: string[], func: AnyFunction]
  ): Speed {
    super._on(...args);

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
      // Here ids is considered as a single Catalyst id
      delete this._speedTweensList[ids];
    }

    return this;
  }
}
