export type TimerStatus = 'idle' | 'running' | 'paused';

export interface TimerState {
  status: TimerStatus;
  baseElapsedMs: number;
  startedAtMs: number | null;
  isVisible: boolean;
}

export type TimerAction =
  | { type: 'START'; nowMs: number }
  | { type: 'PAUSE'; nowMs: number }
  | { type: 'RESUME'; nowMs: number }
  | { type: 'STOP' }
  | { type: 'SHOW' }
  | { type: 'HIDE' }
  | { type: 'HYDRATE'; payload: TimerState };

export const TIMER_STORAGE_KEY = 'global_floating_timer_v1';

export const initialTimerState: TimerState = {
  status: 'idle',
  baseElapsedMs: 0,
  startedAtMs: null,
  isVisible: true,
};

function clampMs(value: unknown): number {
  if (typeof value !== 'number' || !Number.isFinite(value)) {
    return 0;
  }
  return Math.max(0, value);
}

export function sanitizeTimerState(raw: unknown): TimerState {
  if (!raw || typeof raw !== 'object') {
    return initialTimerState;
  }

  const candidate = raw as Partial<TimerState>;
  const status: TimerStatus =
    candidate.status === 'running' || candidate.status === 'paused' || candidate.status === 'idle'
      ? candidate.status
      : 'idle';

  const baseElapsedMs = clampMs(candidate.baseElapsedMs);
  const startedAtMs =
    typeof candidate.startedAtMs === 'number' && Number.isFinite(candidate.startedAtMs)
      ? candidate.startedAtMs
      : null;

  const isVisible = typeof candidate.isVisible === 'boolean' ? candidate.isVisible : true;

  if (status === 'running' && startedAtMs === null) {
    return {
      status: 'paused',
      baseElapsedMs,
      startedAtMs: null,
      isVisible,
    };
  }

  return {
    status,
    baseElapsedMs,
    startedAtMs: status === 'running' ? startedAtMs : null,
    isVisible,
  };
}

export function getElapsedMs(state: TimerState, nowMs: number): number {
  if (state.status !== 'running' || state.startedAtMs === null) {
    return state.baseElapsedMs;
  }

  const delta = Math.max(0, nowMs - state.startedAtMs);
  return state.baseElapsedMs + delta;
}

export function formatElapsedMs(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}:${seconds}`;
}

export function timerReducer(state: TimerState, action: TimerAction): TimerState {
  switch (action.type) {
    case 'START': {
      if (state.status === 'running') {
        return state;
      }

      if (state.status === 'paused') {
        return {
          ...state,
          status: 'running',
          startedAtMs: action.nowMs,
          isVisible: true,
        };
      }

      return {
        status: 'running',
        baseElapsedMs: 0,
        startedAtMs: action.nowMs,
        isVisible: true,
      };
    }

    case 'PAUSE': {
      if (state.status !== 'running' || state.startedAtMs === null) {
        return state;
      }

      const elapsed = state.baseElapsedMs + Math.max(0, action.nowMs - state.startedAtMs);
      return {
        ...state,
        status: 'paused',
        baseElapsedMs: elapsed,
        startedAtMs: null,
      };
    }

    case 'RESUME': {
      if (state.status !== 'paused') {
        return state;
      }

      return {
        ...state,
        status: 'running',
        startedAtMs: action.nowMs,
        isVisible: true,
      };
    }

    case 'STOP': {
      return {
        ...state,
        status: 'idle',
        baseElapsedMs: 0,
        startedAtMs: null,
      };
    }

    case 'SHOW': {
      if (state.isVisible) {
        return state;
      }
      return {
        ...state,
        isVisible: true,
      };
    }

    case 'HIDE': {
      if (!state.isVisible) {
        return state;
      }
      return {
        ...state,
        isVisible: false,
      };
    }

    case 'HYDRATE': {
      return sanitizeTimerState(action.payload);
    }

    default:
      return state;
  }
}
