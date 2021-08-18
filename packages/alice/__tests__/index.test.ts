beforeEach(() => {
  jest.resetModules();
});

describe('Success cases', () => {
  test('It should return a scrollTop value different from 0', async () => {
    // Change the scroll value to 1000px.
    global.scrollY = 1000;
    console.log(
      '🚀 ~ file: index.test.ts ~ line 9 ~ test ~ global.scrollY',
      global.scrollY
    );

    const { Alice } = await import('../src/index');
    console.log('🚀 ~ file: index.test.ts ~ line 12 ~ test ~ Alice', Alice);
    const alice = new Alice();
    console.log('🚀 ~ file: index.test.ts ~ line 14 ~ test ~ alice', alice);
    alice.initialize();
    console.log('🚀 ~ file: index.test.ts ~ line 16 ~ test ~ alice', alice);

    // Trigger the window scroll event.
    global.dispatchEvent(new Event('scroll'));
    global.dispatchEvent(new Event('scroll'));

    console.log(
      '🚀 ~ file: index.test.ts ~ line 28 ~ test ~ alice.scroll.data.scrollTop',
      alice.scroll.data.scrollTop
    );

    expect(alice.scroll.data.scrollTop).toStrictEqual(1000);

    alice.destroy();
  });

  test('It should not take the first scroll event into consideration', async () => {
    // Change the scroll value to 1000px.
    global.scrollY = 1000;

    const { Alice } = await import('../src/index');
    const alice = new Alice();
    alice.initialize();

    // Triggering the window's first scroll event only.
    global.dispatchEvent(new Event('scroll'));

    expect(alice.scroll.data.scrollTop).toStrictEqual(0);

    alice.destroy();
  });

  test('It should not take the scroll event into consideration', async () => {
    // Change the scroll value to 1000px.
    global.scrollY = 1000;

    const { Alice } = await import('../src/index');
    const alice = new Alice();
    alice.initialize();
    alice.destroy();

    // Trigger the window scroll event.
    global.dispatchEvent(new Event('scroll'));
    global.dispatchEvent(new Event('scroll'));

    expect(alice.scroll.data.scrollTop).toStrictEqual(0);
  });
});
