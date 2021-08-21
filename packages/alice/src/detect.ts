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

export class Detect extends Tween {
  /**
   * @description Boolean ensuring that we can't initialize multiple detection plugins.
   * @static
   * @memberof Detect
   */

  static isInitialized = false;

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
        Detect._reactor.data.scrollTop
      );
    }

    const { boundings, coordinates } = tween.state;
    const { triggerOffset } = tween.options;
    const { height: windowHeight } = Detect._eva.view.data;

    // Computing in view detection for each tween.
    tween.state.isInView = isInView(
      Detect._reactor.data.scrollTop,
      windowHeight,
      triggerOffset,
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

  private _handleTweenList() {
    Object.values(this._detectTweensList).forEach((tween) => {
      if (!tween.options.once || !tween.state.isInView) {
        this._computeDetection(tween);
      }
    });
  }

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

        this._handleResize();
      },
      height: (val: number) => {
        if (!val) {
          return;
        }

        this._handleResize();
      },
    });
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
   * @description Adding new tweens to the detection list.
   * @author Alphability <albanmezino@gmail.com>
   * @param {(any | any[])} elements
   * @param {InputTweenOptions} options
   * @returns {(string | string[])}
   * @memberof Detect
   */

  public add(
    elements: any | any[],
    options: InputTweenOptions
  ): string | string[] {
    const ids = super._add(
      <HTMLElement | HTMLElement[]>elements,
      <TweenOptions>options
    );

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
   * @param {...[eventName: string, ids: string[], func: AnyFunction]} args
   * @returns {Detect}
   * @memberof Detect
   */
  public on(
    ...args: [eventName: string, ids: string[], func: AnyFunction]
  ): Detect {
    super._on(...args);

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
