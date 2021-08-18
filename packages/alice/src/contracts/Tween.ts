import { Boundings } from './View';

export interface TweenCoordinates {
  x: number;
  y: number;
}

export interface TweenState {
  itemId: string | null;
  classes: string[];
  boundings: Boundings | null;
  targetBoundings: null;
  coordinates: TweenCoordinates;
  lerpDone: boolean;
  collant: {
    parsedOffset: number;
    scrollOffset: number;
  };
  isInView: boolean;
  collantEvent: string;
}

export type Offset = string | number;
export type TriggerOffset = Offset | [Offset, Offset];

export interface TweenOptions {
  addClass: boolean;
  once: boolean;
  triggerOffset: TriggerOffset;
  lerpAmount: number;
  speedAmount: number;
  collantOffset: {
    offset: number;
    offsetViewport: string;
  };
  position: string;
}

export interface InputTweenOptions {
  addClass?: boolean;
  once?: boolean;
  triggerOffset?: TriggerOffset;
  lerp?: number;
  speed?: number;
  collantOffset?: {
    offset?: number;
    offsetViewport?: string;
  };
  position?: string;
}

export interface TweenObject {
  element: HTMLElement;
  itemIndex: number;
  options: TweenOptions;
  state: TweenState;
}

export type TweenList = Record<string, TweenObject>;
