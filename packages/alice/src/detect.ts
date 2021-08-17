import { Calvin } from '@endgame/calvin';
import { Tween, TweenObject, TweenOptions } from './tween';

export class Detect {
  /**
   * @description Object allowing the use of reactive data.
   * @private
   * @type {Calvin}
   * @memberof Alice
   */

  private _reactor: Calvin;

  /**
   * @description Watched scrollTop value.
   * @private
   * @memberof Detect
   */
  private _scrollTop = 0;

  private _tween: Tween;

  private _tweensList: TweenObject[];

  /**
   * Creates an instance of Detect.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
   */
  constructor(reactor: Calvin, tween: Tween) {
    this._reactor = reactor;
    this._tween = tween;
  }

  private async _computeBoundings({ element, state }: TweenObject): void {
    // NOTE: Early returns with if statements without curly brackets allow the browser to parse js. Thus, getBoudingClientRect was calling a style recalculation even if it as not used.

    if (!state.boundings) {
      /**
       * We can't use spread operator
       * because the object returned by getBoundingClientRect
       * is a DOMRect, not a classic object.
       */
      state.boundings = await _getBoundings(element, this._scrollTop);
    }
  }

  private _computeInView(tween) {
    const { boundings, coordinates } = tween.state;
    const { triggerOffset } = tween.options;
    const { windowHeight } = prototype._reactor.data;

    // Computing detection for each tween.
    tween.state.isInView = isInView(
      this._scrollTop,
      windowHeight,
      triggerOffset,
      boundings,
      coordinates
    );
  }

  private async _computeDetection(tween: TweenObject) {
    await _computeBoundings(tween);
    _computeInView(tween);
  }

  private _handleTweenList() {
    this._tweensList.forEach((tween) => {
      (!tween.options.once || !tween.state.isInView) &&
        this._computeDetection(tween);
    });
  }

  /**
   * @description Initializing the viewport reactive data abilities when the window object is defined.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
   */
  public initialize(): void {
    this._reactor.watch({
      scrollTop: (val) => {
        this._scrollTop = val;
        this._handleTweenList();
      },
    });
  }

  /**
   * @description Destroying the reactive data object and listeners.
   * @author Alphability <albanmezino@gmail.com>
   * @memberof Detect
   */
  public destroy(): void {
    // const ids = Object.keys(prototype._list);
    // prototype._remove(ids);
  }

  public add(
    elements: HTMLElement | HTMLElement[],
    options: TweenOptions
  ): string | string[] {
    const ids = this._tween.add(elements, options);

    // Update tweens list after registering a new element

    const list = this._tween.getList();
    if (list) {
      this._tweensList = Object.values(list);
    }

    return ids;
  }

  public remove(ids: string[]): Tween {
    this._tweensList = [];
    return this._tween.remove(ids);
  }
}
