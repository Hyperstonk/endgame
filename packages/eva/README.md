# EVA

> EVA: Easy Viewport Access

## Installation

```sh
yarn add @endgame/eva
# or
npm i -S @endgame/eva
```

## The initialization

### Vanilla js users

```js
// Import the constructor
import { Eva } from '@endgame/eva';

// Ask EVA to help you 👌
const eva = new Eva();

/**
 * EVA will be at your disposal everywhere at:
 * 👉 window.$endgame.eva
 */
window.$endgame = {
  eva,
};
```

### Framework usage (example: Nuxt)

```js
// Import the constructor
import { Eva } from '@endgame/eva';

/**
 * If you're using Nuxt I recommend you
 * to do that in a plugin 🚀
 */
... global-plugin.client.js
const initializeEndgame = (_context, inject) => {
  inject('endgame', {
    eva: new Eva(),
  });
};
...

... YourComponent.vue
mounted() {
  /**
   * EVA will be at your disposal at:
   * 👉 this.$endgame.eva
   */
}
...
```

## The methods

### The _initialize_ method

With this method you'll:

👉 Initialize the window's resize event listener.

👉 Prepare EVA to be able to give you info on the viewport.

#### 🥚 Vanilla

```js
window.$endgame.eva.initialize();
```

#### 🍳 Nuxt

```js
... YourComponent.vue

beforeMount() {
  // 🚀 For Nuxt: preferably in layout/default.vue
  this.$endgame.eva.initialize();
},

...
```

### The _destroy_ method

The _destroy_ method will remove all watchers and the resize event listener.
Everything will be ready for garbage collection 👌

#### 🥚 Vanilla

```js
window.$endgame.eva.destroy();
```

#### 🍳 Vue.js

```js
... YourComponent.vue

beforeDestroy(){
  this.$endgame.eva.destroy();
},

...
```

## Access and watch viewport data

For purposes of listening to window's width, height changes, breakpoints updates, etc. you only need one method: _watch_.

```js
/**
 * width, height, outerWidth and outerHeight are built-in watchers.
 * With them you'll be able to listen to the window's resized values.
 */

// 🥚 Vanilla EVA access
const { eva } = window.$endgame;

// 🍳 Vue EVA access
// const { eva } = this.$endgame;

// Access the declared window reactive data
// SEE: @endgame/calvin
console.log(eva.viewport.data.width);
console.log(eva.viewport.data.height);
console.log(eva.viewport.data.outerWidth);
console.log(eva.viewport.data.outerHeight);

// Get notified any time the window's data are updated
eva.viewport.watch({
  width: (val) => {
    console.log(`window inner width: ${val}`);
  },
  height: (val) => {
    console.log(`window inner height: ${val}`);
  },
  outerWidth: (val) => {
    console.log(`window outer width: ${val}`);
  },
  outerHeight: (val) => {
    console.log(`window outer height: ${val}`);
  },
});
```
