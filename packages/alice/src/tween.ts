type AnyFunction = (...args: any[]) => typeof args;

export interface TweenOptions {
  addClass: boolean;
  once: number;
  triggerOffset: number;
  lerpAmount: number;
  speedAmount: number;
  collantOffset: {
    offset: number;
    offsetViewport: string;
  };
  position: string;
}

export interface TweenObject {
  element: HTMLElement;
  itemIndex: number;
  options: any;
  state: any;
}

type TweenList = Record<string, TweenObject>;

const _makeEventId = (id: string, eventName: string) => `${id}-${eventName}`;

const _removeStringFromArray = (str: string, array: string[]) =>
  array.splice(array.indexOf(str), 1);

const _arrayEquals = (a: any[], b: any[]) =>
  a.length === b.length && a.every((val, index) => val === b[index]);

export class Tween {
  private _namespace = 'tween';
  private _idTicket = 0;
  private _list: TweenList = {};
  private _events = ['enter-view', 'leave-view'];
  private _notifications: Record<string, AnyFunction[]> = {};

  private _defaultOptions: TweenOptions = {
    addClass: true,
    once: 0,
    triggerOffset: 0,
    lerpAmount: 0,
    speedAmount: 0,
    collantOffset: {
      offset: 0,
      offsetViewport: '0vh',
    },
    position: 'top',
  };

  private _defaultState = {
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

  constructor() {
    // Don't do anything here.
    // All plugins are instanciated even if not used.
  }

  private _emit(propertyName: string, propertyValue: any) {
    const propertyWatchers = this._notifications[propertyName];
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
        if (!this._notifications[propertyName])
          this._notifications[propertyName] = [];
        this._notifications[propertyName].push(notification);
      }
    );
  }

  private _flush(propertyName: string) {
    delete this._notifications[propertyName];
  }

  private _getProxyState(element: HTMLElement, itemIndex: number) {
    // ⚠️ The state needs to be declared here in order to give a fresh object to each proxy
    const state = JSON.parse(JSON.stringify(this._defaultState));

    return new Proxy(state, {
      set: (target, prop, propValue, receiver) => {
        const oldClasses = [...target.classes];
        // isInView
        if (prop === 'isInView' && target.isInView !== propValue) {
          const eventName = propValue ? 'enter-view' : 'leave-view';
          const eventId = _makeEventId(target.itemId, eventName);
          this._emit(eventId, {
            itemIndex,
          });

          if (propValue) {
            target.classes.push('--in-view');
          } else {
            _removeStringFromArray('--in-view', target.classes);
          }
        }

        // collantEvent
        if (prop === 'collantEvent' && target.collantEvent !== propValue) {
          const eventId = _makeEventId(target.itemId, propValue);
          this._emit(eventId, {
            itemIndex,
          });

          _removeStringFromArray(`--${target.collantEvent}`, target.classes);
          target.classes.push(`--${propValue}`);
        }

        // classes updates
        if (!_arrayEquals(oldClasses, target.classes)) {
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
    options: TweenOptions,
    itemIndex = 0
  ): string {
    // Keep updating _idTicket in order to always attach a unique id to your new Catalyst items
    this._idTicket += 1;
    const itemId = `${this._namespace}-${this._idTicket}`;

    /**
     * itemIndex will be updated if the DOMElement came from an array
     */
    this._list[itemId] = {
      element,
      itemIndex,
      options: {
        ...this._defaultOptions,
        ...options,
      },
      state: this._getProxyState(element, itemIndex),
    };
    this._list[itemId].state.itemId = itemId;

    return itemId;
  }

  private _subscribeItemToEvent(
    eventName: string,
    id: string,
    func: AnyFunction
  ) {
    const eventId = _makeEventId(id, eventName);
    this._on({ [eventId]: func });
  }

  private _removeItem(id: string) {
    this._events.forEach((eventName) => {
      this._flush(`${id}-${eventName}`);
    });
    delete this._list[id];
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
      // Here elements is considered as a single DOMElement
      return this._addItem(elements, options);
    }
  }

  public on(eventName: string, ids: string[], func: AnyFunction): Tween {
    // Events name check (ensuring that every functions will have a reference in order to use removeEventListener).
    if (!this._events.includes(eventName))
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

  public getList(): TweenList | null {
    return Object.keys(this._list) ? this._list : null;
  }
}
