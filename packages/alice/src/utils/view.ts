import fastdomCore from 'fastdom';
import fastdomPromised from 'fastdom/extensions/fastdom-promised';

import {
  TriggerOffsets,
  TweenCoordinates,
  TweenObject,
} from '../contracts/Tween';
import { Boundings } from '../contracts/View';

// fastdom extension
const fastdom = fastdomCore.extend(fastdomPromised);

export const getBoundings = async (
  element: HTMLElement,
  scrollTop: number
): Promise<Boundings> => {
  const {
    top,
    right,
    bottom,
    left,
    width,
    height,
    x,
    y,
  } = await fastdom.measure(() => <Boundings>element.getBoundingClientRect());
  return {
    top: top + scrollTop,
    right,
    bottom: bottom + scrollTop,
    left,
    width,
    height,
    x,
    y: y + scrollTop,
  };
};

export const getTriggerOffset = (
  { inputOptions: { triggerOffset } }: TweenObject,
  boundings: Boundings
): TriggerOffsets => {
  const defaultValues: TriggerOffsets = [0, 0];

  if (!triggerOffset) {
    return defaultValues;
  }

  let inputOffset = [triggerOffset, triggerOffset];

  try {
    if (Array.isArray(triggerOffset)) {
      // Throw if more than two values.
      if (triggerOffset.length !== 2) {
        throw new Error(
          'One of your triggerOffset option contains an array with less or more than two values.'
        );
      }

      inputOffset = triggerOffset;
    }

    const {
      top: triggerOffsetTop,
      bottom: triggerOffsetBottom,
    } = inputOffset.reduce(
      (acc, offset, index) => {
        let parsedOffset = 0;
        const key = index === 0 ? 'top' : 'bottom';

        if (typeof offset === 'number' && !isNaN(offset)) {
          parsedOffset = offset;
        } else if (
          typeof offset === 'string' &&
          offset.match(/^[0-9]{1,}vh$/g)
        ) {
          parsedOffset =
            parseFloat(offset.replace('vh', '')) * (window.innerHeight / 100);
        } else if (
          typeof offset === 'string' &&
          offset.match(/^[0-9]{1,}%$/g)
        ) {
          parsedOffset =
            parseInt(offset.replace('%', ''), 10) * (boundings.height / 100);
        } else {
          throw new Error(
            `There is a problem with the syntax of one of your triggerOffset option: ${triggerOffset}`
          );
        }
        return { ...acc, [key]: parsedOffset };
      },
      { top: 0, bottom: 0 }
    );

    return [triggerOffsetTop, triggerOffsetBottom];
  } catch (error) {
    console.error(error);
  }

  return defaultValues;
};

export const isInView = (
  scrollTop: number,
  windowHeight: number,
  triggerOffsets: TriggerOffsets,
  boundings: Boundings = {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    width: 0,
    height: 0,
    x: 0,
    y: 0,
  },
  coordinates: TweenCoordinates = { x: 0, y: 0 }
): boolean => {
  const { top, bottom } = boundings;
  const { y } = coordinates;
  const [triggerOffsetTop, triggerOffsetBottom] = triggerOffsets;

  const isUnderWindow = top + triggerOffsetTop + y - windowHeight > scrollTop;
  const isAboveWindow = bottom - triggerOffsetBottom + y < scrollTop;

  return (!isUnderWindow || isAboveWindow) && (isUnderWindow || !isAboveWindow);
};
