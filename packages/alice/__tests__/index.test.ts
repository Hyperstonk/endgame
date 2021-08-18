import { Alice } from '../src/index';

const alice = new Alice();

beforeEach(() => {
  // Init before each test
  alice.initialize();
});

afterEach(() => {
  // Resetting Alice instance values before next test.
  global.scrollY = 0;
  global.dispatchEvent(new Event('scroll'));
  alice.destroy();
});

describe('Success cases', () => {
  test('It should return a scrollTop value different from 0', async () => {
    // Change the scroll value to 1000px.
    global.scrollY = 1000;

    // Trigger the window scroll event.
    global.dispatchEvent(new Event('scroll'));
    global.dispatchEvent(new Event('scroll'));

    expect(alice.scroll.data.scrollTop).toStrictEqual(1000);
  });

  test('It should not take the first scroll event into consideration', async () => {
    // Change the scroll value to 1000px.
    global.scrollY = 1000;

    // Triggering the window's first scroll event only.
    global.dispatchEvent(new Event('scroll'));

    expect(alice.scroll.data.scrollTop).toStrictEqual(0);
  });

  test('It should not take the scroll event into consideration', async () => {
    // Change the scroll value to 1000px.
    global.scrollY = 1000;

    alice.destroy();

    // Trigger the window scroll event.
    global.dispatchEvent(new Event('scroll'));
    global.dispatchEvent(new Event('scroll'));

    expect(alice.scroll.data.scrollTop).toStrictEqual(0);
  });
});
