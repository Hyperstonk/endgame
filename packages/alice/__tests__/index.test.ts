describe('Success cases', () => {
  test('It should return a scrollTop value different from 0', () => {
    jest.isolateModules(() => {
      // Change the scroll value to 1000px.
      global.scrollY = 1000;

      // eslint-disable-next-line
      const { Alice } = require('../src/index');
      const alice = new Alice();
      alice.initialize();

      // Trigger the window scroll event.
      global.dispatchEvent(new Event('scroll'));
      global.dispatchEvent(new Event('scroll'));

      expect(alice.scroll.data.scrollTop).toStrictEqual(1000);

      alice.destroy();
    });
  });

  test('It should not take the first scroll event into consideration', () => {
    jest.isolateModules(() => {
      // Change the scroll value to 1000px.
      global.scrollY = 1000;

      // eslint-disable-next-line
      const { Alice } = require('../src/index');
      const alice = new Alice();
      alice.initialize();

      // Triggering the window's first scroll event only.
      global.dispatchEvent(new Event('scroll'));

      expect(alice.scroll.data.scrollTop).toStrictEqual(0);

      alice.destroy();
    });
  });

  test('It should not take the scroll event into consideration', () => {
    jest.isolateModules(() => {
      // Change the scroll value to 1000px.
      global.scrollY = 1000;

      // eslint-disable-next-line
      const { Alice } = require('../src/index');
      const alice = new Alice();
      alice.initialize();
      alice.destroy();

      // Trigger the window scroll event.
      global.dispatchEvent(new Event('scroll'));
      global.dispatchEvent(new Event('scroll'));

      expect(alice.scroll.data.scrollTop).toStrictEqual(0);
    });
  });
});
