# ALICE

> ALICE: Another Library Implementing Captivating Effects

## ALICE will help you:

👂 Listen to the window's scroll event.

📏 Get the window's scrolled distance.

🛑 Listen to a cool _scroll end_ event.

👁️ Watch elements entering and leaving the view.

🔮 Add speed/parallax to the watched elements.

## Table of contents

## 🚨 Disclamer

Under the hood ALICE is using [CALVIN](https://github.com/MBDW-Studio/endgame/tree/main/packages/calvin) and [EVA](https://github.com/MBDW-Studio/endgame/tree/main/packages/eva).

If you're not familiar with these two packages we recommend you to check them out. A lot of the following sections will be based on their features.

## The installation

```sh
yarn add -S @endgame/alice
# or
npm i -S @endgame/alice
```

## The initialization

### Vanilla js users

```js
// Import the constructor
import { Alice } from '@endgame/alice';

// Ask ALICE to help you 👌
const alice = new Alice(['detect', 'speed']);

/**
 * VANILLA JS USERS
 *
 * ALICE will be at your disposal everywhere at:
 * 👉 window.$endgame.alice
 */
window.$endgame = {
  alice,
};
```

### Framework usage (example: Nuxt)

```js
// Import the constructor
import { Alice } from '@endgame/alice';

/**
 * If you're using Nuxt we recommend you
 * to do that in a plugin 🚀
 */
... global-plugin.js
const initializeEndgame = (_context, inject) => {
  inject('endgame', {
    eva: new Alice(['detect', 'speed']),
  });
};
...

... SomeVueComponent.vue
mounted() {
  /**
   * ALICE will be at your disposal at:
   * 👉 this.$endgame.alice
   */
}
...
```

## The basics

Four basic methods will help you handle ALICE's basic features lifecycle.

- initialize: Initialize all ALICE's features.
- bootScrollValues: Boot scroll event initial values (handy when changing page).
- update: Trigger a complete ALICE update.
- destroy: Destroy ALICE instance.

### The _initialize_ method

This is the first function to call. With this function you'll start ALICE. During the initialization, the function will:

👉 Initialize [@endgame/eva](https://github.com/MBDW-Studio/endgame/tree/main/packages/eva).

👉 Initialize the window's scroll event listener.

👉 Initialize the plugins (detect and speed) to access features like listening to properties with the [_on function_](#the-on-method).

👉 Use the [@endgame/eva](https://github.com/MBDW-Studio/endgame/tree/main/packages/eva)'s resize event listener to handle the [_tweens_](#the-tweens) when resizing the page.

#### 🥚 Vanilla

```js
// Initialize ALICE
window.$endgame.alice.initialize();
```

#### 🍳 Nuxt

```js
... SomeVueComponent.vue

beforeMount() {
  // 🚀 For Nuxt: preferably in layout/default.vue
  this.$endgame.alice.initialize();
},

...
```

### The _bootScrollValues_ method

With this function you'll initialize the scroll values. Distinguishing this from the `initialize` method is pretty useful since you'll be able to initialize the scroll values when you're sure that the elements in the window are in place.

This method will come in handy when changing page (if your app/website uses the History API).

> 🚨 This function will only work if you previously used the [_initialize_ method](#the-initialize-method).

#### 🥚 Vanilla

```js
// Boot the scroll values in order lay the groundwork
// for your tweens (this part will come later).
window.$endgame.alice.bootScrollValues();
```

#### 🍳 Nuxt

```js
... SomeVueComponent.vue

mounted() {
  // Boot the scroll values in order lay the groundwork
  // for your tweens (this part will come later).
  this.$endgame.alice.bootScrollValues();
},

...
```

### The _update_ method

With the update function you'll be able to force update ALICE's global context.

By global context we mean:

👉 Re-compute the total distance scrolled (see [_scrollTop_](#scrollTop)).

👉 Re-compute the [_tweens_](#the-tweens) positions.

👉 Re-compute the [_tweens_](#the-tweens) effects (like _detection_, _parallax_, _lerp_, etc.).

> 🚨 This function will only work if you previously used the [_initialize_ method](#the-initialize-method).

#### 🥚 Vanilla

```js
window.$endgame.alice.update();
```

#### 🍳 Vue.js

```js
... SomeVueComponent.vue

mounted(){
  this.$endgame.alice.update();
},

...
```

### The _destroy_ method

The `destroy` method will remove all [_tweens_](#the-tweens) and their logic. Then, it will remove the scroll object instance and all its listeners. Finally, it will destroy the [EVA](https://github.com/MBDW-Studio/endgame/tree/main/packages/eva) instance used under the hood.

Everything will be ready for garbage collection 👌

> 🚨 This function will only work if you previously used the [_initialize_ method](#the-initialize-method).

#### 🥚 Vanilla

```js
window.$endgame.alice.destroy();
```

#### 🍳 Vue.js

```js
... SomeVueComponent.vue

beforeDestroy(){
  this.$endgame.alice.destroy();
},

...
```

## Keep this simple

To keep this documentation concise, we'll use `$endgame` as the global variable containing the `alice` instance in your project.

No more vanilla js vs Vue stuff. Only `$endgame`.

### Example

```js
/**
 * Depending on your project we'll use the following as an alias for:
 * - window.$endgame.alice.initialize()
 * - this.$endgame.alice.initialize()
 */
$endgame.alice.initialize();
```

## Global architecture

To ease your experience with the package, ALICE exposes specific objects as a way to split her features into groups.

- `scroll`
- `view`
- `detect`
- `speed`

### Scroll

After initializing ALICE you'll be able to play with the page scroll. ALICE keeps performances at heart and will declare only one scroll listener for all her features.

You'll find every scroll event related stuff at `$endgame.alice.scroll`.

The scroll object is a CALVIN instance. So, you'll be able to use the `computed`, `watch` and `unwatch` methods (see [CALVIN](https://github.com/MBDW-Studio/endgame/tree/main/packages/calvin)).

By default you can access two values: `scrollTop` and `isScrolling`.

#### scrollTop

```js
// Logging the current scroll distance from the top of the page.
console.log($endgame.alice.scroll.data.scrollTop);

$endgame.alice.scroll.watch({
  scrollTop: (scrolledDistance) => {
    // Logging the scrolled distance everytime scrollTop gets updated
    console.log(scrolledDistance);
  },
});
```

#### isScrolling

```js
// Logging the current scroll event state.
console.log($endgame.alice.scroll.data.isScrolling);

$endgame.alice.scroll.watch({
  isScrolling: (weAreScrolling) => {
    // Logging 'nope' everytime the user stops scrolling
    if (!weAreScrolling) {
      console.log('nope');
    }
  },
});
```

### View

ALICE uses EVA to easily access viewport values (like the window width). Since ALICE uses EVA anyways, we thought that it would be great to expose her through ALICE.

So, after initializing ALICE you'll be able to easily play with the window values without declaring an EVA instance yourself.

You'll find every viewport related stuff at `$endgame.alice.view`.

The view object is an EVA instance, which is using CALVIN under the hood. So, you'll be able to use the `computed`, `watch` and `unwatch` methods (see [EVA](https://github.com/MBDW-Studio/endgame/tree/main/packages/eva) and [CALVIN](https://github.com/MBDW-Studio/endgame/tree/main/packages/calvin)).

By default you can access four different values: `width`, `height`, `outerWidth` and `outerHeight`.

See [EVA](https://github.com/MBDW-Studio/endgame/tree/main/packages/eva) to learn more about what she can do for you.

### Detect

The `detect` object will enable you to detect HTML elements with ease. These detected elements will be reffered as _tweens_ later on.

You'll find this object at `$endgame.alice.detect`.

- You'll be able to add and remove detected elements easily.
- Listen to specific events.
- etc.

### Speed

The `speed` object will enable you to detect HTML elements with ease. These detected elements will be reffered as _tweens_ later on.

You'll find this object at `$endgame.alice.speed`.

- You'll be able to add and remove speed elements easily.
- Listen to specific events.
- etc.

## The tweens

Here's the real magic !

Counting scrolled pixels is quite nice... but between us that's for amateurs 💅

We'll now learn how to watch elements and make awesome things with them 🔥

Firstly, you need to learn the basics, i.e. `add` and `remove` HTML elements.

### The _add_ function and _remove_ method

Tweening an element will unleash a ton of awesome dark magic spells... that you're not ready to learn for now.

We'll start with the simple stuff.
To do simple magic you only need one thing:

👉 An HTML element or a list of HTML elements.

Keep in mind that the `add` function returns a single tween id or a list of tween ids.

```js
// 🚨 Do not forget to init ALICE! (See the sections above)

// NOTE: detect on speed objects work the same way.

// ⚡ Starting with one HTML element
// element is our HTML element.
const element = document.getElementById('my-element-id');

// Add the element to the detect tween list.
const id = $endgame.alice.detect.add(element);

// Remove the HTML element from the tween list.
$endgame.alice.detect.remove(id);

// ⚡ We can do the same with multiple HTML elements.
// elements is our list of HTML elements.
const elements = document.getElementsByClassName('elements-class-name');

// Add the elements to the speed tween list.
const ids = $endgame.alice.speed.add(element);

// Remove the HTML elements from the tween list.
$endgame.alice.speed.remove(ids);

/**
 * 😍 Since we removed all the elements from their tween lists,
 * your tweens are ready for garbage collection.
 */
```

> 🚨 **Nota bene**  
> By adding HTML elements you'll enable default behaviors for your tweens like:
>
> 👉 Auto toggling an **_--in-view_** class on the elements when they enter the viewport.
>
> 👉 Dispatching two events: **_enter-view_** and **_leave-view_** accessible from the **_detect_** and **_speed_** objects.

### The _on_ method

The `on` method will allow you to listen to the specific events below.

#### The _enter-view_ and _leave-view_ events

```js
// 🚨 We'll say that element is my HTML element

// Add the element to the detect tween list.
const id = $endgame.alice.detect.add(element);

// ⚡ You can chain the on methods
$endgame.alice.detect
  .on('enter-view', id, () => {
    console.log('Is in view');
  })
  .on('leave-view', id, () => {
    console.log("Isn't in view");
  });
```

## 🔮 The dark magic

To really get to the good stuff, you'll need to pass an additional _options_ object to your `add` function.

```js
const id = $endgame.alice.detect.watch(htmlElement, {
  // Here goes your options
});
```

> 🧰 The options in context
>
> There are some options that you can apply to your watched element. Instead of listing all of them, we'll see them depending on what you want to achieve.

### 🔍 Elements detection

To detect HTML elements you'll need to use the `$endgame.alice.detect` object.

In this context the following options will be taken into account:

👉 addClass

👉 once

👉 triggerOffset

#### ⚙️ The _addClass_ option

Type: `boolean`

Default value: `true`

##### 📝 Description

By default an `--in-view` class will be added to your HTML elements as they enter the viewport. The class is automatically removed when your HTML elements leave the latter.

By setting `addClass` to `false`, this feature will be disabled for all the tweens added by the `add` function.

```js
// Example
const ids = $endgame.alice.detect.watch(htmlElements, {
  addClass: false,
});
```

#### ⚙️ The _once_ option

Type: `boolean`

Default value: `false`

##### 📝 Description

Decide whether or not the elements entrance will be watched multiple times. By default any in/out-view state change will be recorded.

By setting `once` to `true`, only the first in-view state will be recorded. No following change will  
take effect.

```js
// Example
const ids = $endgame.alice.detect.watch(htmlElements, {
  once: true,
});
```

#### ⚙️ The _triggerOffset_ option

Type: `number` or `string` or `[number|string, number|string]`

Default value: `0`

##### 📝 Description

By default your HTML element will be detected when one of those two conditions is met:

👉 The bottom of the window reaches the top of the element.

👉 The top of the window reaches the bottom of the element.

The `triggerOffset` parameter will only shift the top and bottom boundaries.

With positive values the boundaries will shift towards the center of your HTML element.

With negative values the boundaries will shift away from the center of your HTML element.

##### Examples

A `triggerOffset` set to `50` will shift the top and bottom boundaries of your element to 50 pixels towards its center.

A `triggerOffset` set to `'10%'` will shift the top and bottom boundaries of your element to 10 percent of its current height towards its center.

![alt text](./doc/images/trigger-offset.png 'Trigger offset schema')

```js
// Example of allowed values

// The first value of an array of offsets is used as the element's top offset
// The second value of an array of offsets is used as the element's bottom offset
const ids = $endgame.alice.detect.watch(htmlElements, {
  // You can use numbers and strings containing 'vh' or '%'
  // triggerOffset: 10,
  // triggerOffset: [10, 10],
  // triggerOffset: '-20vh',
  // triggerOffset: '14%',
  // triggerOffset: ['10vh', '-10%'],
});
```

### 🚀 Apply speed

> 🚨 The previous features shown in the [detect section](#🔍-elements-detection) are also available with the speed tweens.

To add speed to HTML elements you'll need to use the `$endgame.alice.speed` object.

In this context the following parameters will be taken into account:

👉 speed

👉 lerp

#### ⚙️ The _speed_ property

Type: `number`

Default value: `0`

##### 📝 Description

The speed property will allow you to create parallax effects.

Any element of the page with a `speed` of `0` will scroll the normal amount of pixels.

Any element with a `speed` of `1` will scroll the normal amount of pixels **plus an extra 10%** of this amount.

Any element with a **positive speed** will **disappear faster than a classic element**.

Any element with a **negative speed** will **fight against the current** and disappear slower than any classic element.

```js
// Example
const ids = $endgame.alice.speed.watch(htmlElements, {
  speed: 0.9,
  // speed: -2,
  // speed: -0.756,
  // speed: 4.2,
  // Play with the values to find the best for your elements
});
```

#### ⚙️ The _lerp_ property

Type: `number` ∈ [0,1]

Default value: `1`

##### 📝 Description

In mathematics, [lerp (linear interpolation)](https://en.wikipedia.org/wiki/Linear_interpolation) is a method of curve fitting using linear polynomials to construct new data points within the range of a discrete set of known data points.

**In our case, the simplest translation would be this schema**.
![alt text](./doc/images/lerp.png 'Linear interpolation schema')

By setting a lerp value, at each frame, the normal translation value (coming from the speed property) will be lerped.

The `(x0, y0)` point would be the element current position. The `(x1, y1)` point would be the new element's position with a speed property applied to it. The effective position will be the `(x,y)` point.

By changing the lerp factor between `0` and `1` you're currently translating the red point on the red line.

By repeating this computation for each frame, you'll have a sense of delay applied to your initial `speed` factor.

```js
// Example
const ids = $endgame.alice.speed.watch(htmlElements, {
  speed: 2,
  lerp: 0.9,
});
```
