import { Eva } from '../src/index';

describe('Success cases', () => {
  test('It should return a viewport width different from 0', () => {
    // Use modern in order to run lodash decounce function
    jest.useFakeTimers('modern');

    // Change the viewport width to 0px.
    global.innerWidth = 0;

    const eva = new Eva();
    eva.initialize();

    // Change the viewport width to 1000px.
    global.innerWidth = 1000;
    // Trigger the window resize event.
    global.dispatchEvent(new Event('resize'));

    // Run debounce function after resize
    jest.runAllTimers();

    expect(eva.viewport.data.width).toStrictEqual(1000);
  });

  test('It should return a viewport height different from 0', () => {
    // Use modern in order to run lodash decounce function
    jest.useFakeTimers('modern');

    // Change the viewport height to 0px.
    global.innerHeight = 0;

    const eva = new Eva();
    eva.initialize();

    // Change the viewport height to 1000px.
    global.innerHeight = 1000;
    // Trigger the window resize event.
    global.dispatchEvent(new Event('resize'));

    // Run debounce function after resize
    jest.runAllTimers();

    expect(eva.viewport.data.height).toStrictEqual(1000);
  });

  test('It should dampen the resize class addition during consecutive resize events', () => {
    // Use modern in order to run lodash decounce function
    jest.useFakeTimers('modern');

    // Change the viewport width to 0px.
    global.innerWidth = 0;

    const eva = new Eva();
    eva.initialize();

    // Change the viewport width to 1000px.
    global.innerWidth = 1000;
    // Trigger the window resize event.
    global.dispatchEvent(new Event('resize'));
    // Trigger the window resize event again.
    global.dispatchEvent(new Event('resize'));

    // Run debounce function after resize
    jest.runAllTimers();

    expect(eva.viewport.data.width).toStrictEqual(1000);
  });

  test('It should not take the resize event into consideration', () => {
    // Change the viewport width to 0px.
    global.innerWidth = 0;

    const eva = new Eva();
    eva.initialize();
    eva.destroy();

    // Change the viewport width to 1000px.
    global.innerWidth = 1000;
    // Trigger the window resize event.
    global.dispatchEvent(new Event('resize'));

    expect(eva.viewport.data.width).toStrictEqual(0);
  });
});
