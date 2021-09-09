import { TweenCoordinates } from '../contracts/Tween';

export const lerp = (start: number, end: number, amount: number): number =>
  (1 - amount) * start + amount * end;

export function getTranslate(element: HTMLElement): TweenCoordinates {
  const translate = {
    x: 0,
    y: 0,
  };

  const style = getComputedStyle(element);
  const transform: CSSStyleDeclaration['transform'] =
    // @ts-ignore
    style.transform || style.webkitTransform || style.mozTransform;

  let mat = transform.match(/^matrix3d\((.+)\)$/);
  if (mat) {
    translate.x = parseFloat(mat[1].split(', ')[12]);
    translate.y = parseFloat(mat[1].split(', ')[13]);
  }

  mat = transform.match(/^matrix\((.+)\)$/);
  if (mat) {
    translate.x = parseFloat(mat[1].split(', ')[4]);
    translate.y = parseFloat(mat[1].split(', ')[5]);
  }

  return translate;
}

export const lerpCoordinates = (
  element: HTMLElement,
  lerpAmount: number,
  coordinates: TweenCoordinates
): TweenCoordinates => {
  if (lerpAmount <= 0 || lerpAmount > 1) {
    return coordinates;
  }

  const { x: startX, y: startY } = getTranslate(element);

  return {
    x: lerp(startX, coordinates.x, lerpAmount),
    y: lerp(startY, coordinates.y, lerpAmount),
  };
};

export const applyTransform = (
  element: HTMLElement,
  { x, y }: TweenCoordinates
): void => {
  let transformProp = 'transform';
  let willChangeProp = 'transform';
  if (!(transformProp in element.style) && 'msTransform' in element.style) {
    transformProp = 'msTransform';
    willChangeProp = '-ms-transform';
  }

  const transformValue = `matrix3d(1,0,0.00,0,0.00,1,0.00,0,0,0,1,0,${x},${y},0,1)`;

  element.style.willChange = willChangeProp;
  // @ts-ignore
  element.style[transformProp] = transformValue;
};

export const clearTransform = (element: HTMLElement): void => {
  element.style.removeProperty('msTransform');
  element.style.removeProperty('transform');
};
