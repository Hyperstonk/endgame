import { Eva } from '@endgame/eva';

import {
  InputTweenOptions,
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
   * @type {TweenObject[]}
   * @memberof Detect
   */

  private _detectTweensList: TweenObject[] = [];

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
    this._detectTweensList.forEach((tween) => {
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

    Detect.isInitialized = true;

    Detect._reactor.watch({
      scrollTop: () => {
        this._handleTweenList();
      },
    });
    Detect._eva.view.watch({
      width: (val) => {
        if (!val) {
          return;
        }

        this._handleResize();
      },
      height: (val) => {
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
    const ids = Object.keys(Detect._list);
    this.remove(ids);
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
    const ids = super.add(
      <HTMLElement | HTMLElement[]>elements,
      <TweenOptions>options
    );

    // Update tweens list after registering a new element
    if (Object.keys(Detect._list)) {
      this._detectTweensList = Object.values(Detect._list);
    }

    return ids;
  }

  /**
   * @description Removing tweens by id.
   * @author Alphability <albanmezino@gmail.com>
   * @param {string[]} ids
   * @returns {Tween}
   * @memberof Detect
   */

  public remove(ids: string[]): Tween {
    this._detectTweensList = [];
    return super.remove(ids);
  }
}
