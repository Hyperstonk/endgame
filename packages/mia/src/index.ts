import { Calvin } from '@endgame/calvin';

export class Mia {
  /**
   * @description The focus switch delay in ms.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @static
   * @memberof Mia
   */

  static _focusEndDelay = 500;

  /**
   * @description Object allowing the use of reactive data.
   * Storing a11y state values.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @static
   * @type {Calvin}
   * @memberof Mia
   */

  static _reactor: Calvin = new Calvin({ focusActive: false });

  /**
   * @description The focus event's last target.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @private
   * @type {(HTMLElement | null)}
   * @memberof Mia
   */

  private _target: HTMLElement | null = null;

  /**
   * @description Boolean ensuring that we can't initialize multiple a11y listeners.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @private
   * @memberof Mia
   */

  private _isInitialized = false;

  /**
   * Creates an instance of Mia.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @memberof Mia
   */

  constructor() {
    this._handleFocus = this._handleFocus.bind(this);
    this._removeFocus = this._removeFocus.bind(this);
  }

  /**
   * @description Removing the focus on the last target.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @private
   * @param {(Event | undefined)} [event=undefined]
   * @memberof Mia
   */

  private _removeFocus(event: Event | undefined = undefined): void {
    document.documentElement.classList.remove('visible-focus-style');

    if (event && event.target) {
      const target = event.target as HTMLElement;
      setTimeout(() => {
        if (target === this._target) {
          Mia._reactor.data.focusActive = false;
        }
      }, Mia._focusEndDelay);
    }
  }

  /**
   * @description Adding focus on the new target.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @private
   * @param {(EventTarget | null)} target
   * @return {*}  {void}
   * @memberof Mia
   */
  private _handleNewTarget(target: EventTarget | null): void {
    if (!target) {
      return;
    }

    // Registering new target
    this._target = <HTMLElement>target;

    const nameLowercased = this._target.nodeName.toLowerCase();
    if (
      nameLowercased === 'input' ||
      nameLowercased === 'select' ||
      nameLowercased === 'textarea' ||
      nameLowercased === 'a' ||
      nameLowercased === 'button'
    ) {
      if (!Mia._reactor.data.focusActive) {
        Mia._reactor.data.focusActive = true;
      }

      this._target.addEventListener('blur', this._removeFocus, false);
      document.documentElement.classList.add('visible-focus-style');
    } else {
      this._removeFocus();
    }
  }

  /**
   * @description Handling global HTML elements focus.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @private
   * @param {KeyboardEvent} { key, target }
   * @return {*}  {void}
   * @memberof Mia
   */

  private _handleFocus({ key, target }: KeyboardEvent): void {
    if (!key || key !== 'Tab') {
      return;
    }

    // ⚡ Avoid memory leak by removing old listeners before registering new ones
    if (this._target) {
      this._target.removeEventListener('blur', this._removeFocus, false);
    }

    this._handleNewTarget(target);
  }

  /**
   * @description Initializing the a11y abilities.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @memberof Mia
   */

  public initialize(): void {
    // No multiple init
    // Avoid having multiple listeners at the same time.
    if (this._isInitialized) {
      return;
    }

    this._isInitialized = true;

    document.documentElement.classList.add('a11y');
    document.addEventListener('keyup', this._handleFocus, false);
  }

  /**
   * @description Destroying the listeners.
   * @author AVIIIVII <albanmezino@gmail.com>
   * @memberof Mia
   */

  public destroy(): void {
    document.removeEventListener('keyup', this._handleFocus, false);
    document.documentElement.classList.remove('a11y');

    this._isInitialized = false;
  }

  /**
   * @description Reactive properties object's getter.
   * @readonly
   * @type {Calvin}
   * @memberof Mia
   */

  get reactor(): Calvin {
    return Mia._reactor;
  }
}
