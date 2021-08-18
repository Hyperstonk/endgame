import { Eva } from '@endgame/eva';

import {
  InputTweenOptions,
  TweenObject,
  TweenOptions,
} from './contracts/Tween';
import { Tween } from './tween';
import { isInView, getBoundings } from './utils/view';

export class Detect extends Tween {
  static isInitialized = false;

  static _eva: Eva;

  private _detectTweensList: TweenObject[] = [];

  /**
   * Creates an instance of Detect.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
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

  private _handleTweenList() {
    this._detectTweensList.forEach((tween) => {
      if (!tween.options.once || !tween.state.isInView) {
        this._computeDetection(tween);
      }
    });
  }

  /**
   * @description Initializing the viewport reactive data abilities when the window object is defined.
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
   * @description Destroying the reactive data object and listeners.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
   */
  public destroy(): void {
    const ids = Object.keys(Detect._list);
    this.remove(ids);
    Detect.isInitialized = false;
  }

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

  public remove(ids: string[]): Tween {
    this._detectTweensList = [];
    return super.remove(ids);
  }
}
