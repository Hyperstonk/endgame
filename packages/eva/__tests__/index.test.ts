import { Eva } from '../src/index';

const eva = new Eva();

// Use modern in order to run lodash debounce function
jest.useFakeTimers('modern');

beforeEach(() => {
  // Init before each test
  eva.initialize();
});

afterEach(() => {
  // Resetting Alice instance values before next test.
  global.innerWidth = 0;
  global.dispatchEvent(new Event('resize'));
  eva.destroy();
});

describe('Success cases', () => {
  test('It should return a viewport width different from 0', () => {
    // Change the viewport width to 1000px.
    global.innerWidth = 1000;
    // Trigger the window resize event.
    global.dispatchEvent(new Event('resize'));

    // Run debounce function after resize
    jest.runOnlyPendingTimers();

    expect(eva.view.data.width).toStrictEqual(1000);
  });

  test('It should return a viewport height different from 0', () => {
    // Change the viewport height to 1000px.
    global.innerHeight = 1000;
    // Trigger the window resize event.
    global.dispatchEvent(new Event('resize'));

    // Run debounce function after resize
    jest.runOnlyPendingTimers();

    expect(eva.view.data.height).toStrictEqual(1000);
  });

  test('It should dampen the resize class addition during consecutive resize events', () => {
    // Change the viewport width to 1000px.
    global.innerWidth = 1000;
    // Trigger the window resize event.
    global.dispatchEvent(new Event('resize'));
    // Trigger the window resize event again.
    global.dispatchEvent(new Event('resize'));

    // Run debounce function after resize
    jest.runOnlyPendingTimers();

    expect(eva.view.data.width).toStrictEqual(1000);
  });

  test('It should not take the resize event into consideration', () => {
    eva.destroy();

    // Change the viewport width to 1000px.
    global.innerWidth = 1000;
    // Trigger the window resize event.
    global.dispatchEvent(new Event('resize'));

    expect(eva.view.data.width).toStrictEqual(0);
  });
});
