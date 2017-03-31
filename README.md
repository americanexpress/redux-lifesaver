# redux-lifesaver

`lifesaver` is a middleware that keeps track of how many times actions of the
same type are dispatched within a given period. If a single action type is
dispatched more times than the allowed amount within a given period, subsequent
dispatches of that action type will be blocked from the reducer for the same
period. At the end of the period, the most recently attempted dispatch of that
action type will go through.

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

`lifesaver` accepts a configuration object with four optional properties,
`dispatchLimit`, `limitDuration`, `actionTypes`, and `actionCreator`. Where
`dispatchLimit` is the number of dispatches allowed for a single action type in
a given period, and `limitDuration` is the duration of that period in
milliseconds. `dispatchLimit` defaults to `10`, and `limitDuration` to `100`.
`actionTypes` should be an object with keys that are action types that you want
to have a special configuration. The values are objects that contain
`dispatchLimit` and/or `limitDuration`. For instance, if you had a
`VERY_SPECIAL_ACTION` that shouldn't be limited at all, your configuration
object may look like this:

```js
import { VERY_SPECIAL_ACTION } from './path/to/my/duck';

const lifesaverConfig = {
  actionTypes: {
    [VERY_SPECIAL_ACTION]: {
      limitDuration: 0,
    },
  },
};
```

`actionCreator` will replace the action creator that `lifesaver` dispatches when
it throttles an action. This can be handy if you are using thunks and want to do
something outside your reducer when an action is throttled. For instance:

```js
import { actionThrottled } from 'redux-lifesaver';
import { reportError, REPORT_ERROR } from './some/path';

const actionCreator = (action) => (dispatch) =>
  dispatch(reportError({
    message: `Over exuberant dispatching of ${action.type}, throttling`,
    data: action,
  })).then(() => dispatch(actionThrottled(action)));

const lifesaverConfig = {
  actionCreator,
  actionTypes: {
    [REPORT_ERROR]: {
      limitDuration: 0,
    },
  },
};
```

## Contributing
We welcome Your interest in the American Express Open Source Community on Github.
Any Contributor to any Open Source Project managed by the American Express Open
Source Community must accept and sign an Agreement indicating agreement to the
terms below. Except for the rights granted in this Agreement to American Express
and to recipients of software distributed by American Express, You reserve all
right, title, and interest, if any, in and to Your Contributions. Please [fill
out the Agreement](http://goo.gl/forms/mIHWH1Dcuy).

## License
Any contributions made under this project will be governed by the [Apache License
2.0](https://github.com/americanexpress/redux-lifesaver/blob/master/LICENSE.txt).

## Code of Conduct
This project adheres to the [American Express Community Guidelines](https://github.com/americanexpress/redux-lifesaver/wiki/Code-of-Conduct).
By participating, you are expected to honor these guidelines.
