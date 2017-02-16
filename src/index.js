export const ACTION_THROTTLED = 'lifesaver/ACTION_THROTTLED';

export default function createLifesaverMiddleware(dispatchLimit = 10, limitDuration = 100) {
  const pastActions = {};

  return ({ dispatch }) => next => (action) => {
    const actionRecord = pastActions[action.type];
    const now = Date.now();
    if (actionRecord) {
      actionRecord.count += 1;
    } else {
      pastActions[action.type] = {
        time: now,
        count: 1,
      };
      return next(action);
    }

    if (now - actionRecord.time > limitDuration) {
      delete pastActions[action.type];
      return next(action);
    }

    if (actionRecord.count < dispatchLimit) {
      return next(action);
    }

    actionRecord.next = () => {
      dispatch(action);
      delete pastActions[action.type];
    };

    if (!actionRecord.timeout) {
      console.warn(`Over-exuberant dispatching of ${action.type}, throttling`);
      actionRecord.timeout = setTimeout(() => actionRecord.next(), limitDuration);
      return next({
        type: ACTION_THROTTLED,
        action,
      });
    }

    return null;
  };
}
