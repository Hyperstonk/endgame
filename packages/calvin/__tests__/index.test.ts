import { Calvin } from '../src/index';

describe('Failure cases', () => {
  test('It should throw an error if no arguments are passed to the constructor', () => {
    expect(() => {
      // @ts-ignore
      new Calvin();
    }).toThrowError();
  });

  test('It should not change the value of a computed property if we try to set it outside the instance', () => {
    const calvin = new Calvin({ test1: 0 });
    calvin.computed({
      test2(): number {
        return this.test1 + 1;
      },
    });

    calvin.data.test2 = 10;

    expect(calvin.data.test2).toStrictEqual(1);
  });
});

describe('Success cases', () => {
  test('It should have a reeactive data value "test1" initialized to 0', () => {
    const calvin = new Calvin({ test1: 0 });

    expect(calvin.data.test1).toStrictEqual(0);
  });

  test('It should have a reactive data value "test1" updated to 1', () => {
    const calvin = new Calvin({ test1: 0 });
    calvin.data.test1 = 1;

    expect(calvin.data.test1).toStrictEqual(1);
  });

  test('It should have a computed property based on a reactive data that equals 2', () => {
    const calvin = new Calvin({ test1: 0 });
    calvin.computed({
      test2(): number {
        return this.test1 + 1;
      },
    });
    calvin.data.test1 = 1;

    expect(calvin.data.test1).toStrictEqual(1);
    expect(calvin.data.test2).toStrictEqual(2);
  });

  test('It should have a computed property based on another computed property that equals 3', () => {
    const calvin = new Calvin({ test1: 0 });
    calvin.computed({
      test2(): number {
        return this.test1 + 1;
      },
      test3(): number {
        return this.test2 + 1;
      },
    });
    calvin.data.test1 = 1;

    expect(calvin.data.test1).toStrictEqual(1);
    expect(calvin.data.test2).toStrictEqual(2);
    expect(calvin.data.test3).toStrictEqual(3);
  });

  test('It should have a watcher called when a reactive data is updated', () => {
    const calvin = new Calvin({ test1: 0 });
    calvin.watch({
      test1: (value) => {
        expect(value).toStrictEqual(1);
      },
    });

    calvin.data.test1 = 1;
  });

  test('It should have a watcher called when a computed property is updated', () => {
    const calvin = new Calvin({ test1: 0 });
    calvin.computed({
      test2() {
        return this.test1 + 1;
      },
    });

    calvin.watch({
      test2: (value) => {
        expect(value).toStrictEqual(2);
      },
    });

    calvin.data.test1 = 1;
  });

  test('It should remove the watcher before it beeing called', () => {
    const calvin = new Calvin({ test1: 0 });
    calvin.computed({
      test2() {
        return this.test1 + 1;
      },
    });

    const watcherFunction = jest.fn();

    const watcherIds = calvin.watch({
      test2: watcherFunction,
    });

    calvin.unwatch(watcherIds);

    calvin.data.test1 = 1;

    expect(watcherFunction).not.toHaveBeenCalled();
  });
});
