import { describe, expect, it } from 'vitest';
import {
  getElapsedMs,
  initialTimerState,
  sanitizeTimerState,
  timerReducer,
  type TimerState,
} from './timerReducer';

describe('timerReducer', () => {
  it('starts from idle at zero and ignores start while running', () => {
    const started = timerReducer(initialTimerState, { type: 'START', nowMs: 1_000 });
    expect(started.status).toBe('running');
    expect(started.baseElapsedMs).toBe(0);
    expect(started.startedAtMs).toBe(1_000);

    const startedAgain = timerReducer(started, { type: 'START', nowMs: 1_200 });
    expect(startedAgain).toEqual(started);
  });

  it('pauses and resumes without losing elapsed time', () => {
    const running: TimerState = {
      status: 'running',
      baseElapsedMs: 500,
      startedAtMs: 1_000,
      isVisible: true,
    };

    const paused = timerReducer(running, { type: 'PAUSE', nowMs: 2_000 });
    expect(paused.status).toBe('paused');
    expect(paused.baseElapsedMs).toBe(1_500);
    expect(paused.startedAtMs).toBeNull();

    const resumed = timerReducer(paused, { type: 'RESUME', nowMs: 3_000 });
    expect(resumed.status).toBe('running');
    expect(resumed.baseElapsedMs).toBe(1_500);
    expect(resumed.startedAtMs).toBe(3_000);
  });

  it('stops and resets elapsed while preserving visibility choice', () => {
    const paused: TimerState = {
      status: 'paused',
      baseElapsedMs: 9_000,
      startedAtMs: null,
      isVisible: false,
    };

    const stopped = timerReducer(paused, { type: 'STOP' });
    expect(stopped.status).toBe('idle');
    expect(stopped.baseElapsedMs).toBe(0);
    expect(stopped.startedAtMs).toBeNull();
    expect(stopped.isVisible).toBe(false);
  });

  it('handles hide/show state', () => {
    const hidden = timerReducer(initialTimerState, { type: 'HIDE' });
    expect(hidden.isVisible).toBe(false);

    const shown = timerReducer(hidden, { type: 'SHOW' });
    expect(shown.isVisible).toBe(true);
  });
});

describe('timer state helpers', () => {
  it('computes elapsed from timestamps with no drift accumulation', () => {
    const state: TimerState = {
      status: 'running',
      baseElapsedMs: 1_000,
      startedAtMs: 10_000,
      isVisible: true,
    };

    expect(getElapsedMs(state, 13_250)).toBe(4_250);
  });

  it('sanitizes invalid persisted state', () => {
    const invalid = sanitizeTimerState({
      status: 'running',
      baseElapsedMs: -500,
      startedAtMs: null,
      isVisible: 'yes',
    });

    expect(invalid.status).toBe('paused');
    expect(invalid.baseElapsedMs).toBe(0);
    expect(invalid.startedAtMs).toBeNull();
    expect(invalid.isVisible).toBe(true);
  });
});
