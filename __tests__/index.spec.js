import createLifesaverMiddleware, { ACTION_THROTTLED } from '../src';

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

  it('returns next if there is no record', () => {
    middle(action);
    expect(next).toHaveBeenCalledWith(action);
  });

  it('returns next if the delta is greater than the configured limit duration', () => {
    middle(action);
    next.mockClear();
    now = 200;
    middle(action);
    expect(next).toHaveBeenCalledWith(action);
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
    expect(dispatch).not.toHaveBeenCalled();
    expect(setTimeout).toHaveBeenCalledTimes(1);
    jest.runOnlyPendingTimers();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(action);
  });

  it('returns next with a THROTTLED_ACTION if the dispatch limit is exceeded within the configured limit duration', () => {
    let i = 0;
    while (i < 10) {
      middle(action);
      i += 1;
    }
    expect(next).toHaveBeenLastCalledWith({
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
    expect(dispatch).not.toHaveBeenCalled();
    expect(setTimeout).toHaveBeenCalledTimes(1);
    jest.runOnlyPendingTimers();
    expect(dispatch).toHaveBeenCalledTimes(1);
    expect(dispatch).toHaveBeenCalledWith(newAction);
  });

  it('returns null if the timeout has already been set', () => {
    let i = 0;
    while (i < 10) {
      middle(action);
      i += 1;
    }
    expect(middle(action)).toBe(null);
  });

  it('throttles many of the same action', () => {
    let i = 0;
    while (i < 20) {
      middle(action);
      i += 1;
    }
    expect(next).toHaveBeenCalledTimes(10);
  });

  it('lets through unique action types', () => {
    let i = 0;
    while (i < 20) {
      middle({ type: `UNIQUE_ACTION_${i}` });
      i += 1;
    }
    expect(next).toHaveBeenCalledTimes(20);
  });
});
