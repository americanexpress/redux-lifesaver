export const ACTION_THROTTLED = 'lifesaver/ACTION_THROTTLED';

export default function createLifesaverMiddleware(dispatchLimit = 10, limitDuration = 100) {
  const pastActions = {};

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

    if (now - actionRecord.time > limitDuration && !actionRecord.timeout) {
      // If it has been longer since the recorded time than the limit duration,
      // and no timeout has been set, refresh the action record and continue.
      pastActions[action.type] = freshRecord;
      return next(action);
    }

    if (actionRecord.count < dispatchLimit) {
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
      actionRecord.timeout = setTimeout(() => actionRecord.next(), limitDuration);
      // and continue, but with ACTION_THROTTLED action.
      return next({
        type: ACTION_THROTTLED,
        action,
      });
    }

    // If an action is being throttled, but the timeout is already set, return null.
    return null;
  };
}
