import { Calvin } from '@endgame/calvin';
export declare class Eva {
  private _reactor;
  private _dampeningTransitions;
  private _resizeEndDelay;
  constructor();
  private _collectWindowValues;
  private _resizeEventHandler;
  private _dampTransitions;
  private _resizeEnd;
  private _attachListeners;
  private _detachListeners;
  initialize(): void;
  destroy(): void;
  get viewport(): Calvin;
}
