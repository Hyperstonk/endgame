/* eslint-disable no-unused-vars */
type Watcher = (val: any) => void;

type Computed = (this: Record<string, any>) => any;
/* eslint-enable no-unused-vars */

export class Calvin {
  /**
   * @description Unique id incremented for each new watcher
   * @private
   * @memberof Calvin
   */
  private _watcherAutoNumber = 0;

  /**
   * @description Proxy containing reactive data and computed properties.
   * @private
   * @type {Record<string, any>}
   * @memberof Calvin
   */
  private _data: Record<string, any> = {};

  /**
   * @description Object containing the watchers associated with reactive data and computed properties.
   * @private
   * @type {Record<string, any>}
   * @memberof Calvin
   */
  private _watchers: Record<string, Record<string, any>> = {};

  /**
   * @description State used to avoid external call to computed properties setters
   * @private
   * @memberof Calvin
   */
  private _setComputed = false;

  /**
   * @description Variable used to keep track of the computed property that we need to register as a dependency of another reactive property.
   * @private
   * @type {(string | number | symbol)}
   * @memberof Calvin
   */
  private _currentDependent: string | number | symbol = '';

  /**
   * @description List of the dependencies attached to their respective reactive properties.
   * @private
   * @type {Record<string, string[]>}
   * @memberof Calvin
   */
  private _dependencies: Record<string, string[]> = {};

  /**
   * @description Object containing the computed properties' functions.
   * @private
   * @type {Record<string, any>}
   * @memberof Calvin
   */
  private _computedFunctions: Record<string, any> = {};

  /**
   * Creates an instance of Calvin.
   * @author Alphability <albanmezino@gmail.com>
   * @param {Record<string, any>} data
   * @memberof Calvin
   */
  constructor(data: Record<string, any>) {
    this._makeReactive(data);
  }

  /**
   * @description The method that initialize the Proxy that will contain the reactive properties. The method contains the implementation of the reactive properties' getters and setters logic.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {Record<string, any>} data
   * @memberof Calvin
   */
  private _makeReactive(data: Record<string, any>): void {
    this._data = new Proxy(data, {
      get: (...args) => {
        const [, property] = args;

        // Run only when a computed property tries to access a data property
        if (this._currentDependent) {
          // Registering the current dependent (computed property) as a dependence of the retrived data
          // Casting property into string because we cannot (yet) use symbols as type index.
          this._depend(<string>property);

          // Resetting the current dependent
          this._currentDependent = '';
        }

        return Reflect.get(...args);
      },
      set: (...args) => {
        // The receiver is the proxy itself
        const [target, property, value, receiver] = args;

        // Avoiding external call to setter by checking if _setComputed is truthy
        if (
          this._setComputed &&
          this._computedFunctions.hasOwnProperty(property)
        ) {
          // Defining the computed property as the current dependent that we'll handle
          this._currentDependent = property;

          // Setting the computed property value
          // It will call the data getters that computed property depends on
          target[<string>property] = this._computedFunctions[
            <string>property
          ].call(receiver);

          // Call involved watchers
          // Casting property into string because we cannot (yet) use symbols as type index.
          this._notify(<string>property, target[<string>property]);

          this._setComputed = false;
        } else if (!this._computedFunctions.hasOwnProperty(property)) {
          // Setting the data value
          target[<string>property] = value;

          // Call involved watchers
          // Casting property into string because we cannot (yet) use symbols as type index.
          this._notify(<string>property, value);
        }

        // Updating the computed properties that depend on the current property
        if (this._dependencies.hasOwnProperty(property)) {
          this._updateDependents(<string>property);
        }

        // Indicates that the setter ran successfully
        return true;
      },
    });
  }

  /**
   * @description Calls the watchers of the involved reactive property.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} property
   * @param {*} value
   * @memberof Calvin
   */
  private _notify(property: string, value: any): void {
    if (
      this._watchers[property] &&
      Object.keys(this._watchers[property]).length >= 1
    ) {
      Object.values(this._watchers[property]).forEach((watcher: Watcher) => {
        if (watcher) {
          watcher(value);
        }
      });
    }
  }

  /**
   * @description Registers the dependent (computed property) as a dependency of the involved reactive property.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} property
   * @memberof Calvin
   */
  private _depend(property: string): void {
    if (!this._dependencies[property]) {
      this._dependencies[property] = [];
    }

    if (
      !this._dependencies[property].includes(<string>this._currentDependent)
    ) {
      this._dependencies[property].push(<string>this._currentDependent);
    }
  }

  /**
   * @description Updates all the dependents of the involved reactive property.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} property
   * @memberof Calvin
   */
  private _updateDependents(property: string): void {
    this._dependencies[property].forEach((dependent: string) => {
      // Forcing to calculate the computed value
      this._setComputed = true;
      this._data[dependent] = null;
    });
  }

  /**
   * @description Stores the computed function of the computed property to be. Initializes its value right after storing the function.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} property
   * @param {Computed} computed
   * @memberof Calvin
   */
  private _makeComputed(property: string, computed: Computed): void {
    if (!this._computedFunctions[property]) {
      this._computedFunctions[property] = [];
    }

    // Storing the computed function
    this._computedFunctions[property] = computed;

    // Forcing to calculate the computed value
    this._setComputed = true;
    this._data[property] = null;
  }

  /**
   * @description Stores the watcher function of a reactive property.
   * @author Alphability <albanmezino@gmail.com>
   * @private
   * @param {string} property
   * @param {Watcher} watcher
   * @memberof Calvin
   */
  private _observe(property: string, watcher: Watcher): string {
    if (!this._watchers[property]) {
      this._watchers[property] = {};
    }

    // Storing the watcher function
    this._watchers[property][this._watcherAutoNumber] = watcher;

    // Increment the watchers id to keep it a unique key.
    this._watcherAutoNumber += 1;

    // Returning the function id
    // property-index
    return `${property}-${this._watcherAutoNumber - 1}`;
  }

  /**
   * @description Iterates through an object of computed properties to register them.
   * @author Alphability <albanmezino@gmail.com>
   * @param {Record<string, Computed>} computedFunctions
   * @memberof Calvin
   */
  public computed(computedFunctions: Record<string, Computed>): void {
    for (const property in computedFunctions) {
      if (computedFunctions.hasOwnProperty(property)) {
        this._makeComputed(property, computedFunctions[property]);
      }
    }
  }

  /**
   * @description Iterates through an object of watchers to register them.
   * @author Alphability <albanmezino@gmail.com>
   * @param {Record<string, Watcher>} watchers
   * @memberof Calvin
   */
  public watch(watchers: Record<string, Watcher>): string[] {
    const ids: string[] = [];

    for (const property in watchers) {
      if (watchers.hasOwnProperty(property)) {
        ids.push(this._observe(property, watchers[property]));
      }
    }

    return ids;
  }

  public unwatch(watchersIds: string[]): Calvin {
    for (const id of watchersIds) {
      const [property, uniqueId] = id.split('-');

      if (
        this._watchers.hasOwnProperty(property) &&
        this._watchers[property].hasOwnProperty(uniqueId)
      ) {
        delete this._watchers[property][uniqueId];
      }
    }

    return this;
  }

  /**
   * @description Reeactive properties object's getter.
   * @readonly
   * @type {*}
   * @memberof Calvin
   */
  get data(): any {
    return this._data;
  }
}
