import fastdomCore from 'fastdom';
import fastdomPromised from 'fastdom/extensions/fastdom-promised';

import { TriggerOffset, TweenCoordinates } from '../contracts/Tween';
import { Boundings } from '../contracts/View';

// fastdom extension
const fastdom = fastdomCore.extend(fastdomPromised);

export const getBoundings = async (
  element: HTMLElement,
  scrollTop: number
): Promise<Boundings> => {
  return await fastdom.measure(() => {
    const { top, right, bottom, left, width, height, x, y } = <Boundings>(
      element.getBoundingClientRect()
    );
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
  });
};

export const isInView = (
  scrollTop: number,
  windowHeight: number,
  triggerOffset: TriggerOffset,
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

  const inputOffset = !Array.isArray(triggerOffset)
    ? [triggerOffset, triggerOffset]
    : triggerOffset;

  const {
    top: triggerOffsetTop,
    bottom: triggerOffsetBottom,
  } = inputOffset.reduce(
    (acc, offset, index) => {
      let parsedOffset = null;
      const key = index === 0 ? 'top' : 'bottom';

      if (typeof offset === 'number' && !isNaN(offset)) {
        parsedOffset = offset;
      } else if (typeof offset === 'string' && offset.endsWith('vh')) {
        parsedOffset =
          parseFloat(offset.replace('vh', '')) * (windowHeight / 100);
      } else if (typeof offset === 'string' && offset.endsWith('%')) {
        parsedOffset =
          parseInt(offset.replace('%', ''), 10) * (boundings.height / 100);
      }

      return { ...acc, [key]: parsedOffset };
    },
    { top: 0, bottom: 0 }
  );

  const isUnderWindow = top + triggerOffsetTop + y - windowHeight > scrollTop;
  const isAboveWindow = bottom - triggerOffsetBottom + y < scrollTop;

  return (!isUnderWindow || isAboveWindow) && (isUnderWindow || !isAboveWindow);
};
