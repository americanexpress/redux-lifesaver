/*
 * Copyright (c) 2017 American Express Travel Related Services Company, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License"); you may not use this file except
 * in compliance with the License. You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software distributed under the License
 * is distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express
 * or implied. See the License for the specific language governing permissions and limitations under
 * the License.
 */

import get from 'lodash/get';

export const ACTION_THROTTLED = '@@lifesaver/ACTION_THROTTLED';
export const actionThrottled = action => ({
  type: ACTION_THROTTLED,
  action,
});

export default function createLifesaverMiddleware({
  dispatchLimit = 10,
  limitDuration = 100,
  actionTypes = {},
  actionCreator = actionThrottled,
} = {}) {
  const ownActionTypes = {
    [ACTION_THROTTLED]: {
      limitDuration: 0,
    },
  };
  const actionConfig = Object.assign({}, ownActionTypes, actionTypes);
  const pastActions = {};

  const getDispatchLimit = action =>
    get(actionConfig, [action.type, 'dispatchLimit'], dispatchLimit);

  const getLimitDuration = action =>
    get(actionConfig, [action.type, 'limitDuration'], limitDuration);

  return ({ dispatch }) => next => (action) => {
    const now = Date.now();
    const actionRecord = pastActions[action.type];
    const freshRecord = {
      time: now,
      count: 1,
    };

    if (actionRecord) {
      // If there is an action record, increment the dispatch count.
      actionRecord.count += 1;
    } else {
      // If there is no action record, create a new one and continue.
      pastActions[action.type] = freshRecord;
      return next(action);
    }

    if (now - actionRecord.time >= getLimitDuration(action) && !actionRecord.timeout) {
      // If it has been longer since the recorded time than the limit duration,
      // and no timeout has been set, refresh the action record and continue.
      pastActions[action.type] = freshRecord;
      return next(action);
    }

    if (actionRecord.count < getDispatchLimit(action)) {
      // If the dispatch count is below the limit, continue.
      return next(action);
    }

    // Set the action to be dispatched at the end of the timeout.
    actionRecord.next = () => {
      dispatch(action);
      delete pastActions[action.type];
    };

    if (!actionRecord.timeout) {
      // If there is no timeout set already, warn the user,
      console.warn(`Over-exuberant dispatching of ${action.type}, throttling`);
      // set the timeout,
      actionRecord.timeout = setTimeout(() => actionRecord.next(), getLimitDuration(action));
      // and dispatch ACTION_THROTTLED action.
      return dispatch(actionCreator(action));
    }

    // If an action is being throttled, but the timeout is already set, return null.
    return null;
  };
}
