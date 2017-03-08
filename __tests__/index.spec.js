import createLifesaverMiddleware, {
  ACTION_THROTTLED,
  actionThrottled,
} from '../src';

jest.useFakeTimers();

describe('redux-lifesaver', () => {
  let dn;
  let cw;
  let lifesaver;
  let middle;
  let now = 0;
  const dispatch = jest.fn();
  const next = jest.fn();

  const action = { type: 'TEST_ACTION' };

  beforeAll(() => {
    dn = Date.now;
    cw = console.warn;
    Date.now = jest.fn(() => {
      now += 1;
      return now;
    });
    console.warn = jest.fn();
  });

  beforeEach(() => {
    jest.clearAllTimers();
    setTimeout.mockClear();
    dispatch.mockClear();
    next.mockClear();
    now = 0;
    lifesaver = createLifesaverMiddleware();
    middle = lifesaver({ dispatch })(next);
  });

  afterAll(() => {
    Date.now = dn;
    console.warn = cw;
  });

  describe('actionThrottled', () => {
    it('returns the expected action shape', () => {
      expect(actionThrottled({ type: 'SOME_ACTION' })).toMatchSnapshot();
    });
  });

  it('returns next if there is no record', () => {
    middle(action);
    expect(next).toHaveBeenCalledWith(action);
  });

  it('returns next if the delta is greater than the configured limit duration', () => {
    let i = 0;
    while (i < 9) {
      middle(action);
      i += 1;
    }
    next.mockClear();
    now = 101;
    middle(action);
    expect(next).toHaveBeenCalledWith(action);
  });

  it('allows the user to configure the limit duration (delta)', () => {
    lifesaver = createLifesaverMiddleware({ limitDuration: 200 });
    middle = lifesaver({ dispatch })(next);
    let i = 0;
    while (i < 9) {
      middle(action);
      i += 1;
    }
    now = 101;
    middle(action);
    expect(dispatch).toHaveBeenLastCalledWith({
      type: ACTION_THROTTLED,
      action,
    });
  });

  it('returns next if the dispatch count is below the configured limit', () => {
    middle(action);
    next.mockClear();
    middle(action);
    expect(next).toHaveBeenCalledWith(action);
  });

  it('logs a warning to the console if the dispatch limit is exceeded within the configured limit duration', () => {
    let i = 0;
    while (i < 10) {
      middle(action);
      i += 1;
    }
    expect(console.warn).toHaveBeenCalled();
    expect(console.warn.mock.calls[0][0]).toMatchSnapshot();
  });

  it('sets a timeout to dispatch the action if the dispatch limit is exceeded within the configured limit duration', () => {
    let i = 0;
    while (i < 10) {
      middle(action);
      i += 1;
    }
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(actionThrottled(action));
    expect(setTimeout).toHaveBeenCalledTimes(1);
    jest.runTimersToTime(100);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith(action);
  });

  it('allows the user to configure the limit duration (timeout)', () => {
    lifesaver = createLifesaverMiddleware({ limitDuration: 200 });
    middle = lifesaver({ dispatch })(next);
    let i = 0;
    while (i < 20) {
      middle(action);
      i += 1;
    }
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(actionThrottled(action));
    expect(setTimeout).toHaveBeenCalledTimes(1);
    jest.runTimersToTime(100);
    expect(dispatch).toHaveBeenCalledTimes(1);
    jest.runTimersToTime(200);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith(action);
  });

  it('allows the user to configure the limit duration (timeout) for a particular action', () => {
    const specialAction = { type: 'SOME_SPECIAL_ACTION' };
    lifesaver = createLifesaverMiddleware({
      actionTypes: {
        [specialAction.type]: {
          limitDuration: 200,
        },
      },
    });
    middle = lifesaver({ dispatch })(next);
    let i = 0;
    while (i < 20) {
      middle(specialAction);
      i += 1;
    }
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(actionThrottled(specialAction));
    expect(setTimeout).toHaveBeenCalledTimes(1);
    jest.runTimersToTime(100);
    expect(dispatch).toHaveBeenCalledTimes(1);
    jest.runTimersToTime(200);
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith(specialAction);
  });

  it('returns a dispatch of ACTION_THROTTLED if the dispatch limit is exceeded within the configured limit duration', () => {
    let i = 0;
    while (i < 10) {
      middle(action);
      i += 1;
    }
    expect(dispatch).toHaveBeenLastCalledWith({
      type: ACTION_THROTTLED,
      action,
    });
  });

  it('updates the return value of the timeout function', () => {
    let i = 0;
    while (i < 10) {
      middle(action);
      i += 1;
    }
    const newAction = { data: 'data', ...action };
    middle(newAction);
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(actionThrottled(action));
    expect(setTimeout).toHaveBeenCalledTimes(1);
    jest.runOnlyPendingTimers();
    expect(dispatch).toHaveBeenCalledTimes(2);
    expect(dispatch).toHaveBeenLastCalledWith(newAction);
  });

  it('returns null if the timeout has already been set', () => {
    let i = 0;
    while (i < 10) {
      middle(action);
      i += 1;
    }
    expect(middle(action)).toBe(null);
  });

  it('returns null if the timeout has already been set even if the delta is greate than the limit duration', () => {
    let i = 0;
    while (i < 10) {
      middle(action);
      i += 1;
    }
    now = 101;
    expect(middle(action)).toBe(null);
  });

  it('throttles many of the same action', () => {
    let i = 0;
    while (i < 20) {
      middle(action);
      i += 1;
    }
    expect(next).toHaveBeenCalledTimes(9);
  });

  it('allows the user to configure the dispatch limit', () => {
    lifesaver = createLifesaverMiddleware({ dispatchLimit: 20 });
    middle = lifesaver({ dispatch })(next);
    let i = 0;
    while (i < 40) {
      middle(action);
      i += 1;
    }
    expect(next).toHaveBeenCalledTimes(19);
  });

  it('allows the user to configure the dispatch limit for a particular action', () => {
    const specialAction = { type: 'SOME_SPECIAL_ACTION' };
    lifesaver = createLifesaverMiddleware({
      actionTypes: {
        [specialAction.type]: {
          dispatchLimit: 20,
        },
      },
    });
    middle = lifesaver({ dispatch })(next);
    let i = 0;
    while (i < 40) {
      middle(specialAction);
      i += 1;
    }
    expect(next).toHaveBeenCalledTimes(19);
  });

  it('lets through unique action types', () => {
    let i = 0;
    while (i < 20) {
      middle({ type: `UNIQUE_ACTION_${i}` });
      i += 1;
    }
    expect(next).toHaveBeenCalledTimes(20);
  });

  it('does not limit its own action', () => {
    let i = 0;
    while (i < 50) {
      middle(actionThrottled(action));
      i += 1;
    }
    expect(next).toHaveBeenCalledTimes(50);
  });
});
