import debounce from 'lodash/debounce';
import raf from 'raf';
import fastdomCore from 'fastdom';
import fastdomPromised from 'fastdom/extensions/fastdom-promised';
import { Calvin } from '@endgame/calvin';

import { AnyFunction } from './contracts';
import {
  TweenOptions,
  TweenList,
  TweenState,
  InputTweenOptions,
  TweenStateDefault,
} from './contracts/Tween';

// fastdom extension
const fastdom = fastdomCore.extend(fastdomPromised);

const makeEventId = (id: string, eventName: string) => `${id}-${eventName}`;

const removeStringFromArray = (str: string, array: string[]) =>
  array.splice(array.indexOf(str), 1);

const arrayEquals = (a: any[], b: any[]) =>
  a.length === b.length && a.every((val, index) => val === b[index]);

export abstract class Tween {
  /**
   * @description Namespace used to generate tweens unique ids.
   * @static
   * @memberof Tween
   */

  static _namespace = 'tween';

  /**
   * @description Incremental number used to generate tweens unique ids.
   * @static
   * @memberof Tween
   */

  static _idTicket = 0;

  /**
   * @description Scroll reactive data.
   * @static
   * @type {Calvin}
   * @memberof Tween
   */

  static _reactor: Calvin;

  /**
   * @description List of all the tweens ordered by id.
   * @static
   * @type {TweenList}
   * @memberof Tween
   */

  static _list: TweenList = {};

  /**
   * @description List of tween's possible events.
   * @static
   * @memberof Tween
   */

  static _events = ['enter-view', 'leave-view'];

  /**
   * @description List of functions sorted by event name.
   * @static
   * @type {Record<string, AnyFunction[]>}
   * @memberof Tween
   */

  static _notifications: Record<string, AnyFunction[]> = {};

  /**
   * @description Default tween options.
   * @static
   * @type {TweenOptions}
   * @memberof Tween
   */

  static _defaultOptions: TweenOptions = {
    addClass: true,
    once: false,
    triggerOffsets: [0, 0],
    lerpAmount: 0,
    speedAmount: 0,
  };

  /**
   * @description Default tween state.
   * @static
   * @type {TweenStateDefault}
   * @memberof Tween
   */

  static _defaultState: TweenStateDefault = {
    itemId: null,
    classes: [],
    boundings: null,
    coordinates: {
      x: 0,
      y: 0,
    },
    triggerOffsetComputed: false,
    // In view considering triggerOffset
    isInView: false,
    // In view not considering triggerOffset for speed computations
    isInSpeedView: false,
    lerpDone: true,
  };

  /**
   * @description Number (ms) used to debounce the tweens reset during window resize.
   * @static
   * @memberof Tween
   */

  static _resizeDelay = 300;

  /**
   * @description Handling tweens when window resizes.
   * @author Alphability <albanmezino@gmail.com>
   * @static
   * @memberof Tween
   */
  static _handleResize = debounce(() => {
    if (!Tween._reactor) {
      return;
    }

    // Read DOM
    Object.values(Tween._list).forEach((item) => {
      /**
       * Resetting each prop that has something to do with the window (positions, scroll, etc.).
       * ⚠️ In order to reset a Proxy prop
       * you need to go to the furthest nested level.
       * NOTE: Do not reset classes here. They're handled in the proxy itself.
       */

      // Reset boundings since they're based on the window's layout
      item.state.boundings = Tween._defaultState.boundings;

      // Reset the transform coordinates since the transforms are cleared during the resize
      item.state.coordinates.x = Tween._defaultState.coordinates.x;
      item.state.coordinates.y = Tween._defaultState.coordinates.y;

      // Allowing the tween to recompute offsets
      item.state.triggerOffsetComputed =
        Tween._defaultState.triggerOffsetComputed;

      // Reset lerp since the transforms have been cleared right before
      item.state.lerpDone = Tween._defaultState.lerpDone;

      // NOTE: In view are computed during the scroll. The resize handler forces a scroll update at the end of the function. So, no need to reset inview values.
    });

    raf(() => {
      /**
       * ⚠️ Force update elements' scroll calculation
       * on the frame following the coordinates resets.
       */

      if (Tween._reactor.data.scrollTop) {
        Tween._reactor.data.scrollTop -= 1;
      }
    });
  }, Tween._resizeDelay);

  /**
   * @description Emitting a notification.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} propertyName
   * @param {*} propertyValue
   * @returns {void}
   * @memberof Tween
   */

  private _emit(propertyName: string, propertyValue: any): void {
    const propertyWatchers = Tween._notifications[propertyName];
    if (!propertyWatchers) {
      return;
    }

    for (const key in propertyWatchers) {
      const notify = propertyWatchers[key];
      notify(propertyValue);
    }
  }

  /**
   * @description Method used to attach new functions to events.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {Record<string, AnyFunction>} notificationsObject
   * @memberof Tween
   */

  private _onEvent(notificationsObject: Record<string, AnyFunction>) {
    Object.entries(notificationsObject).forEach(
      ([propertyName, notification]) => {
        if (!Tween._notifications[propertyName])
          Tween._notifications[propertyName] = [];
        Tween._notifications[propertyName].push(notification);
      }
    );
  }

  /**
   * @description Tween event subscription.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} eventName
   * @param {string} id
   * @param {AnyFunction} func
   * @memberof Tween
   */

  private _subscribeItemToEvent(
    eventName: string,
    id: string,
    func: AnyFunction
  ) {
    const eventId = makeEventId(id, eventName);
    this._onEvent({ [eventId]: func });
  }

  /**
   * @description Deleting all notifications for a specific event.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} propertyName
   * @memberof Tween
   */

  private _flush(propertyName: string) {
    delete Tween._notifications[propertyName];
  }

  private _initSpeedAndLerpAmounts(
    speed = Tween._defaultOptions.speedAmount,
    lerp = Tween._defaultOptions.lerpAmount
  ) {
    return {
      lerpAmount: lerp * 0.1,
      speedAmount: speed * 0.1,
    };
  }

  private _initOptions(inputOptions: InputTweenOptions): TweenOptions {
    const { speed, lerp, ...cleanOptions } = inputOptions;

    // Deleting unwanted properties
    delete cleanOptions.triggerOffset;

    const options: TweenOptions = {
      ...Tween._defaultOptions,
      ...(cleanOptions as TweenOptions),
      ...this._initSpeedAndLerpAmounts(speed, lerp),
    };

    return options;
  }

  /**
   * @description Reactive fresh tween state through the use of Proxy.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {HTMLElement} element
   * @param {number} itemIndex
   * @returns {TweenState}
   * @memberof Tween
   */

  private _getProxyState(
    element: HTMLElement,
    options: TweenOptions,
    itemId: string,
    itemIndex: number
  ): TweenState {
    // ⚠️ The state needs to be declared here in order to give a fresh object to each proxy
    const state: TweenState = {
      ...JSON.parse(JSON.stringify(Tween._defaultState)),
      itemId,
    };

    return new Proxy(state, {
      set: (target, prop, propValue, receiver) => {
        const oldClasses = [...target.classes];

        // isInView
        if (prop === 'isInView' && target.isInView !== propValue) {
          const eventName = propValue ? 'enter-view' : 'leave-view';
          const eventId = makeEventId(target.itemId, eventName);
          this._emit(eventId, {
            itemIndex,
          });

          if (options.addClass) {
            if (propValue) {
              target.classes.push('--in-view');
            } else {
              removeStringFromArray('--in-view', target.classes);
            }
          }
        }

        // classes updates
        if (!arrayEquals(oldClasses, target.classes)) {
          const classesToRemove = oldClasses.filter(
            (x: string) => !target.classes.includes(x)
          );
          const classesToAdd = target.classes.filter(
            (x: string) => !oldClasses.includes(x)
          );

          classesToRemove.forEach((className: string) => {
            fastdom.mutate(() => {
              element.classList.remove(className);
            });
          });
          classesToAdd.forEach((className: string) => {
            fastdom.mutate(() => {
              element.classList.add(className);
            });
          });
        }

        // SEE: https://javascript.info/proxy
        return Reflect.set(target, prop, propValue, receiver);
      },
    });
  }

  /**
   * @description Adding an element to the tween list.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @returns {string}
   * @param {HTMLElement} element
   * @param {InputTweenOptions} options
   * @param [itemIndex=0]
   * @memberof Tween
   */

  private _addItem(
    element: HTMLElement,
    inputOptions: InputTweenOptions,
    itemIndex = 0
  ): string {
    // Keep updating _idTicket in order to always attach a unique id to your new Catalyst items
    Tween._idTicket += 1;
    const itemId = `${Tween._namespace}-${Tween._idTicket}`;

    const processedOptions = this._initOptions(inputOptions);

    /**
     * itemIndex will be updated if the DOMElement came from an array
     */
    Tween._list[itemId] = {
      element,
      itemIndex,
      inputOptions,
      options: processedOptions,
      state: this._getProxyState(element, processedOptions, itemId, itemIndex),
    };

    return itemId;
  }

  /**
   * @description Removing a tween from the tweens list.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} id
   * @memberof Tween
   */

  private _removeItem(id: string) {
    Tween._events.forEach((eventName) => {
      this._flush(`${id}-${eventName}`);
    });
    delete Tween._list[id];
  }

  protected _destroy(): void {
    const ids = Object.keys(Tween._list);
    this._remove(ids);
  }

  /**
   * @description Adding one or more tweens to the tweens list.
   * @author Alphability <albanmezino@gmail.com>
   * @param {(HTMLElement | HTMLElement[])} elements
   * @param {TweenOptions} options
   * @returns {(string | string[])}
   * @memberof Tween
   */

  protected _add(
    elements: HTMLElement | HTMLElement[],
    options: InputTweenOptions
  ): string | string[] {
    if (Array.isArray(elements)) {
      return elements.map((element, itemIndex) =>
        this._addItem(element, options, itemIndex)
      );
    } else {
      // Here "elements" is considered as a single DOMElement
      return this._addItem(elements, options);
    }
  }

  /**
   * @description Allowing us to hook on a specific event.
   * @author Alphability <albanmezino@gmail.com>
   * @param {string} eventName
   * @param {string[]} ids
   * @param {AnyFunction} func
   * @returns {Tween}
   * @memberof Tween
   */

  protected _on(eventName: string, ids: string[], func: AnyFunction): Tween {
    // Events name check (ensuring that every functions will have a reference in order to use removeEventListener).
    if (!Tween._events.includes(eventName))
      throw new Error(
        `The event "${eventName}" passed to <AlicePlugin>.on() is not handled by the element.`
      );

    if (Array.isArray(ids)) {
      ids.forEach((id) => {
        this._subscribeItemToEvent(eventName, id, func);
      });
    } else {
      // Here ids is considered as a single Catalyst id
      this._subscribeItemToEvent(eventName, ids, func);
    }
    return this;
  }

  /**
   * @description Removing tweens from the tweens list by ids.
   * @author Alphability <albanmezino@gmail.com>
   * @param {string[]} ids
   * @returns {Tween}
   * @memberof Tween
   */

  protected _remove(ids: string | string[]): void {
    if (Array.isArray(ids)) {
      ids.forEach((id) => {
        this._removeItem(id);
      });
    } else {
      // Here ids is considered as a single Catalyst id
      this._removeItem(ids);
    }
  }
}
