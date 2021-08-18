import throttle from 'lodash/throttle';
import fastdomCore from 'fastdom';
import fastdomPromised from 'fastdom/extensions/fastdom-promised';
import { Eva } from '@endgame/eva';

import {
  InputTweenOptions,
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
  static isInitialized = false;

  // 60FPS = 60 frames per second = 16 ms per frame
  static _sixtyFpsToMs = 16;

  static _eva: Eva;

  private _speedTweensList: TweenObject[] = [];

  private _ticking = false;

  private _lerpDone = true;

  /**
   * Creates an instance of Speed.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Speed
   */
  constructor() {
    super();
  }

  private async _computeDetection(tween: TweenObject) {
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

  private async _applySpeed(tween: TweenObject) {
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

  private _handleTweenList = throttle(async () => {
    if (this._ticking) {
      return;
    }

    // Register scroll tick
    this._ticking = true;

    this._speedTweensList.forEach((tween) => {
      this._computeDetection(tween);
      this._computeSpeed(tween);
    });

    this._lerpDone = !this._speedTweensList.filter(
      ({ state }) => !state.lerpDone
    ).length;

    const speedMutationPromises = this._speedTweensList.map(
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
    this._speedTweensList.forEach((tween) => {
      clearTransform(tween.element);
    });
  }

  /**
   * @description Initializing the viewport reactive data abilities when the window object is defined.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Speed
   */
  public initialize(): void {
    // No multiple init
    if (Speed.isInitialized) {
      return;
    }

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
   * @description Destroying the reactive data object and listeners.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Speed
   */
  public destroy(): void {
    const ids = Object.keys(Speed._list);
    this.remove(ids);
    Speed.isInitialized = false;
  }

  public add(
    elements: any | any[],
    { speed = 0, lerp = 0, ...otherOptions }: InputTweenOptions
  ): string | string[] {
    const options = <TweenOptions>{
      ...otherOptions,
      lerpAmount: lerp * 0.1,
      speedAmount: speed * 0.1,
    };

    const ids = super.add(<HTMLElement | HTMLElement[]>elements, options);

    // Update tweens list after registering a new element
    if (Object.keys(Speed._list)) {
      this._speedTweensList = Object.values(Speed._list);
    }

    return ids;
  }

  public remove(ids: string[]): Tween {
    this._speedTweensList = [];
    return super.remove(ids);
  }
}
