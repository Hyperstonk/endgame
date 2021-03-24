declare type Watcher = (val: any) => void;
declare type Computed = () => any;
export declare class Calvin {
  private _data;
  private _watchers;
  private _currentDependent;
  private _dependencies;
  private _computedFunctions;
  constructor(data: Record<string, any>);
  private _makeReactive;
  private _notify;
  private _depend;
  private _updateDependents;
  private _makeComputed;
  private _observe;
  computed(computedFunctions: Record<string, Computed>): void;
  watch(watchers: Record<string, Watcher>): void;
  get data(): any;
}
export {};
