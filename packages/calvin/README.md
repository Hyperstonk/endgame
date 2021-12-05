# CALVIN

> CALVIN: Changing Any Lifeless Value Into Notifications

## Installation

```sh
yarn add @endgame/calvin
# or
npm i -S @endgame/calvin
```

## Wait... WHY ?

Writing a lot of JS logic is very cool, stylish and SWAG... but putting too much logic in your files can make them bloated and hard to maintain.

**NOT ANYMORE!!!**

**NOW YOU CAN USE COMPUTED PROPERTIES AND WATCHERS... IN VANILLA JS 😱**

**P.S. TypeScript is fully supported**

## 🤔 Computed properties... watchers... WTF??? Are you even talking English man?

> Yeah dude... just read [thaaaaaaat](https://vuejs.org/v2/guide/computed.html) and then... only then... go cry to your mother!

## The example 😏

```js
import { Calvin } from '@endgame/calvin';

// Declare a new data reactor like this 🚀
const reactor = new Calvin({
  myReactiveData: 0,
});

// Declare computed properties this way
reactor.computed({
  myAwesomeComputed() {
    return `myReactiveData equals: ${this.myReactiveData}`;
  },
});

// Get notified any time a property is updated
reactor.watch({
  myReactiveData() {
    // This watcher will be called whenever you update myReactiveData

    // You can, for example, call a specific method on myReactiveData's update
    handleMyReactiveDataUpdate(this.myReactiveData);
  },
  myAwesomeComputed() {
    // This watcher will be called whenever myAwesomeComputed gets updated
    console.log(this.myAwesomeComputed);
  },
});

// Let's see what can be done with this cool reactor 🔥
// Try to run this loop to see what CALVIN does.
const letsSeeWhatCanBeDoneWithThisCoolReactor = () => {
  setTimeout(() => {
    // Add one every 1 seconds in order to test the reactor's features
    reactor.data.myReactiveData += 1;

    // Repeat it to test it... indefinitely 😍
    letsSeeWhatCanBeDoneWithThisCoolReactor();
  }, 1000);
};
```

## List of features

### Access data

```js
import { Calvin } from '@endgame/calvin';

const reactor = new Calvin({
  myReactiveData: 0,
});

reactor.computed({
  myComputed() {
    return `myReactiveData equals: ${this.myReactiveData}`;
  },
});

// Access the declared data and computed
console.log(reactor.data.myReactiveData);
console.log(reactor.data.myComputed);
```

### Watch

```js
import { Calvin } from '@endgame/calvin';

const reactor = new Calvin({
  myReactiveData: 0,
});

// Get notified any time myReactiveData is updated
reactor.watch({
  myReactiveData() {
    console.log(this.myReactiveData);
  },
});
```

### Unwatch

```js
import { Calvin } from '@endgame/calvin';

const reactor = new Calvin({
  myReactiveData: 0,
});

const watchersIds = reactor.watch({
  myReactiveData() {
    console.log(this.myReactiveData);
  },
});

// ⚡ Unwatch data to avoid memory leak
reactor.unwatch(watchersIds);
```
