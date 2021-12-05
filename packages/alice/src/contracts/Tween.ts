import { Boundings } from './View';

export interface TweenCoordinates {
  x: number;
  y: number;
}

export interface TweenStateDefault {
  itemId: string | null;
  classes: string[];
  boundings: Boundings | null;
  coordinates: TweenCoordinates;
  triggerOffsetComputed: boolean;
  isInView: boolean;
  isInSpeedView: boolean;
  lerpDone: boolean;
}

export interface TweenState extends TweenStateDefault {
  itemId: string;
}

export type TriggerOffsets = [number, number];

export interface TweenOptions {
  addClass: boolean;
  once: boolean;
  triggerOffsets: TriggerOffsets;
  lerpAmount: number;
  speedAmount: number;
}

type InputOffset = string | number;
type InputTriggerOffset = InputOffset | [InputOffset, InputOffset];

export interface InputTweenOptions {
  addClass?: boolean;
  once?: boolean;
  triggerOffset?: InputTriggerOffset;
  lerp?: number;
  speed?: number;
}

export interface TweenObject {
  element: HTMLElement;
  itemIndex: number;
  inputOptions: InputTweenOptions;
  options: TweenOptions;
  state: TweenState;
}

export type TweenList = Record<string, TweenObject>;
