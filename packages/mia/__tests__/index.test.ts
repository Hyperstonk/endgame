import { Mia } from '../src/index';

const mia = new Mia();

// Use modern in order to run time out functions
jest.useFakeTimers('modern');

const buttonId = 'button-id';
const focusBlacklistElementId = 'focus-blacklist-element-id';

beforeAll(() => {
  // Add button to the DOM
  const button = global.document.createElement('button');
  button.id = buttonId;
  global.document.body.appendChild(button);

  // Add p to the DOM
  const p = global.document.createElement('p');
  p.id = focusBlacklistElementId;
  global.document.body.appendChild(p);
});

beforeEach(() => {
  // Init before each test
  mia.initialize();
});

afterEach(() => {
  // Resetting Mia instance values before next test.
  const button = global.document.getElementById(buttonId);
  if (button) {
    button.dispatchEvent(new Event('blur'));

    jest.runOnlyPendingTimers();
  }

  // Destroy before each new test
  mia.destroy();
});

describe('Success cases', () => {
  test('Document element should have an a11y class', () => {
    const { documentElement } = global.document;

    expect(documentElement.classList.contains('a11y')).toStrictEqual(true);
  });

  test("Document element shouldn't have an a11y class", () => {
    const { documentElement } = global.document;

    mia.destroy();

    expect(documentElement.classList.contains('a11y')).toStrictEqual(false);
  });

  test('It should have focusActive === true', () => {
    const button = global.document.getElementById(buttonId);
    if (button) {
      // Trigger the button keyup event.
      button.dispatchEvent(
        new KeyboardEvent('keyup', {
          key: 'Tab',
          bubbles: true,
        })
      );

      expect(mia.reactor.data.focusActive).toStrictEqual(true);
    }
  });

  test('It should have focusActive === true even if Mia is initialized two times', () => {
    const button = global.document.getElementById(buttonId);
    if (button) {
      // Trigger the button keyup event.
      button.dispatchEvent(
        new KeyboardEvent('keyup', {
          key: 'Tab',
          bubbles: true,
        })
      );

      mia.initialize();

      expect(mia.reactor.data.focusActive).toStrictEqual(true);
    }
  });

  test('It should have focusActive === false if target is not whitelisted', () => {
    const p = global.document.getElementById(focusBlacklistElementId);
    if (p) {
      // Trigger the paragraph keyup event.
      p.dispatchEvent(
        new KeyboardEvent('keyup', {
          key: 'Tab',
          bubbles: true,
        })
      );

      expect(mia.reactor.data.focusActive).toStrictEqual(false);
    }
  });

  test('It should have focusActive === false if the key pressed is not Tab', () => {
    // Trigger the document keyup event.
    global.document.dispatchEvent(
      new KeyboardEvent('keyup', {
        key: 'a',
        bubbles: true,
      })
    );

    expect(mia.reactor.data.focusActive).toStrictEqual(false);
  });
});
