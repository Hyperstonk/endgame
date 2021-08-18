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
} from './contracts/Tween';

// fastdom extension
const fastdom = fastdomCore.extend(fastdomPromised);

const makeEventId = (id: string, eventName: string) => `${id}-${eventName}`;

const removeStringFromArray = (str: string, array: string[]) =>
  array.splice(array.indexOf(str), 1);

const arrayEquals = (a: any[], b: any[]) =>
  a.length === b.length && a.every((val, index) => val === b[index]);

export abstract class Tween {
  static _namespace = 'tween';
  static _idTicket = 0;
  static _list: TweenList = {};
  static _events = ['enter-view', 'leave-view'];
  static _notifications: Record<string, AnyFunction[]> = {};

  static _defaultOptions: TweenOptions = {
    addClass: true,
    once: false,
    triggerOffset: 0,
    lerpAmount: 0,
    speedAmount: 0,
    collantOffset: {
      offset: 0,
      offsetViewport: '0vh',
    },
    position: 'top',
  };

  static _defaultState: TweenState = {
    itemId: null,
    classes: [],
    boundings: null,
    targetBoundings: null,
    coordinates: {
      x: 0,
      y: 0,
    },
    lerpDone: true,
    collant: {
      parsedOffset: 0,
      scrollOffset: 0,
    },
    isInView: false,
    collantEvent: '',
  };

  static _reactor: Calvin;

  private _resizingMainHandler = false;

  private _emit(propertyName: string, propertyValue: any) {
    const propertyWatchers = Tween._notifications[propertyName];
    if (!propertyWatchers) {
      return;
    }

    for (const key in propertyWatchers) {
      const notify = propertyWatchers[key];
      notify(propertyValue);
    }
  }

  private _on(notificationsObject: Record<string, AnyFunction>) {
    Object.entries(notificationsObject).forEach(
      ([propertyName, notification]) => {
        if (!Tween._notifications[propertyName])
          Tween._notifications[propertyName] = [];
        Tween._notifications[propertyName].push(notification);
      }
    );
  }

  private _subscribeItemToEvent(
    eventName: string,
    id: string,
    func: AnyFunction
  ) {
    const eventId = makeEventId(id, eventName);
    this._on({ [eventId]: func });
  }

  private _flush(propertyName: string) {
    delete Tween._notifications[propertyName];
  }

  private _getProxyState(element: HTMLElement, itemIndex: number) {
    // ⚠️ The state needs to be declared here in order to give a fresh object to each proxy
    const state = JSON.parse(JSON.stringify(Tween._defaultState));

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

          if (propValue) {
            target.classes.push('--in-view');
          } else {
            removeStringFromArray('--in-view', target.classes);
          }
        }

        // collantEvent
        if (prop === 'collantEvent' && target.collantEvent !== propValue) {
          const eventId = makeEventId(target.itemId, propValue);
          this._emit(eventId, {
            itemIndex,
          });

          removeStringFromArray(`--${target.collantEvent}`, target.classes);
          target.classes.push(`--${propValue}`);
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
            element.classList.remove(className);
          });
          classesToAdd.forEach((className: string) => {
            element.classList.add(className);
          });
        }

        // SEE: https://javascript.info/proxy
        return Reflect.set(target, prop, propValue, receiver);
      },
    });
  }

  private _addItem(
    element: HTMLElement,
    options: InputTweenOptions,
    itemIndex = 0
  ): string {
    // Keep updating _idTicket in order to always attach a unique id to your new Catalyst items
    Tween._idTicket += 1;
    const itemId = `${Tween._namespace}-${Tween._idTicket}`;

    /**
     * itemIndex will be updated if the DOMElement came from an array
     */
    Tween._list[itemId] = {
      element,
      itemIndex,
      options: {
        ...Tween._defaultOptions,
        ...(<TweenOptions>options),
      },
      state: this._getProxyState(element, itemIndex),
    };
    Tween._list[itemId].state.itemId = itemId;

    return itemId;
  }

  private _removeItem(id: string) {
    Tween._events.forEach((eventName) => {
      this._flush(`${id}-${eventName}`);
    });
    delete Tween._list[id];
  }

  protected _handleResize(): void {
    if (this._resizingMainHandler || !Tween._reactor) {
      return;
    }

    this._resizingMainHandler = true;
    const classes: string[][] = [];

    // Read DOM
    Object.values(Tween._list).forEach((item, index) => {
      /**
       * Resetting each prop.
       * ⚠️ In order to reset a Proxy prop
       * you need to go to the furthest nested level.
       */
      classes[index] = [...item.state.classes];
      item.state.classes = Tween._defaultState.classes;
      item.state.boundings = Tween._defaultState.boundings;
      item.state.targetBoundings = Tween._defaultState.targetBoundings;
      item.state.coordinates.x = Tween._defaultState.coordinates.x;
      item.state.coordinates.y = Tween._defaultState.coordinates.y;
      item.state.lerpDone = Tween._defaultState.lerpDone;
      item.state.collant.parsedOffset =
        Tween._defaultState.collant.parsedOffset;
      item.state.collant.scrollOffset =
        Tween._defaultState.collant.scrollOffset;
      item.state.isInView = Tween._defaultState.isInView;
      item.state.collantEvent = Tween._defaultState.collantEvent;
    });

    // Write DOM
    Object.values(Tween._list).forEach((item, index) => {
      classes[index].forEach((className) => {
        fastdom.mutate(() => {
          item.element.classList.remove(className);
        });
      });
    });

    raf(() => {
      /**
       * ⚠️ Force update elements' scroll calculation
       * on the frame following the DOM resets.
       */
      if (Tween._reactor.data.scrollTop) {
        Tween._reactor.data.scrollTop -= 1;
      }

      this._resizingMainHandler = false;
    });
  }

  public add(
    elements: HTMLElement | HTMLElement[],
    options: TweenOptions
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

  public on(eventName: string, ids: string[], func: AnyFunction): Tween {
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

  public remove(ids: string[]): Tween {
    if (Array.isArray(ids)) {
      ids.forEach((id) => {
        this._removeItem(id);
      });
    } else {
      // Here ids is considered as a single Catalyst id
      this._removeItem(ids);
    }
    return this;
  }
}
