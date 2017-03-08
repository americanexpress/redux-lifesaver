# redux-lifesaver

`lifesaver` is a middleware that keeps track of how many times actions of the same type are dispatched within a given period. If a single action type is dispatched more times than the allowed amount within a given period, subsequent dispatches of that action type will be blocked from the reducer for the same period. At the end of the period, the most recently attempted dispatch of that action type will go through.

```js
import { createStore, applyMiddleware } from 'redux';
import lifesaver from 'redux-lifesaver';
import rootReducer from './reducers/index';

// Note: this API requires redux@>=3.1.0
const store = createStore(
  rootReducer,
  applyMiddleware(lifesaver())
);
```

`lifesaver` accepts a configuration object with three optional properties, `dispatchLimit`, `limitDuration`, and `actionTypes`. Where `dispatchLimit` is the number of dispatches allowed for a single action type in a given period, and `limitDuration` is the duration of that period in milliseconds. `dispatchLimit` defaults to `10`, and `limitDuration` to `100`. `actionTypes` should be an object with keys that are action types that you want to have a special configuration. The values are objects that contain `dispatchLimit` and/or `limitDuration`. For instance, if you had a `VERY_SPECIAL_ACTION` that shouldn't be limited at all, your configuration object may look like this:

```js
import { VERY_SPECIAL_ACTION } from './path/to/my/duck';

const lifesaverConfig = {
  [VERY_SPECIAL_ACTION]: {
    limitDuration: 0,
  },
};
```
