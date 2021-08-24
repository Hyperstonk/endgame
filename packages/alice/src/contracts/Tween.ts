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
  isInSpeedView: boolean;
  collantEvent: string;
}

export type TriggerOffsets = [number, number];

export interface TweenOptions {
  addClass: boolean;
  once: boolean;
  triggerOffsets: TriggerOffsets;
  lerpAmount: number;
  speedAmount: number;
  collantOffset: {
    offset: number;
    offsetViewport: string;
  };
  position: string;
}

type InputOffset = string | number;
type InputTriggerOffset = InputOffset | [InputOffset, InputOffset];

export interface InputTweenOptions {
  addClass?: boolean;
  once?: boolean;
  triggerOffset?: InputTriggerOffset;
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
  inputOptions: InputTweenOptions;
  options: TweenOptions;
  state: TweenState;
}

export type TweenList = Record<string, TweenObject>;
