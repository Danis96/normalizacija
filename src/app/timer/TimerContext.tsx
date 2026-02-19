import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useState,
  type ReactNode,
} from 'react';
import {
  TIMER_STORAGE_KEY,
  formatElapsedMs,
  getElapsedMs,
  initialTimerState,
  sanitizeTimerState,
  timerReducer,
  type TimerState,
  type TimerStatus,
} from './timerReducer';

interface TimerContextValue {
  elapsedMs: number;
  elapsedFormatted: string;
  status: TimerStatus;
  isVisible: boolean;
  start: () => void;
  pause: () => void;
  resume: () => void;
  stop: () => void;
  hide: () => void;
  show: () => void;
}

const TimerContext = createContext<TimerContextValue | undefined>(undefined);

function loadInitialTimerState(): TimerState {
  if (typeof window === 'undefined') {
    return initialTimerState;
  }

  try {
    const raw = localStorage.getItem(TIMER_STORAGE_KEY);
    if (!raw) {
      return initialTimerState;
    }

    return sanitizeTimerState(JSON.parse(raw));
  } catch {
    return initialTimerState;
  }
}

export function TimerProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(timerReducer, undefined, loadInitialTimerState);
  const [nowMs, setNowMs] = useState(Date.now());

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(TIMER_STORAGE_KEY, JSON.stringify(state));
  }, [state]);

  useEffect(() => {
    const onStorage = (event: StorageEvent) => {
      if (event.key !== TIMER_STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        const parsed = JSON.parse(event.newValue);
        dispatch({ type: 'HYDRATE', payload: sanitizeTimerState(parsed) });
        setNowMs(Date.now());
      } catch {
        // Ignore malformed values from other tabs.
      }
    };

    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  useEffect(() => {
    if (state.status !== 'running') {
      return;
    }

    setNowMs(Date.now());

    const tick = window.setInterval(() => {
      setNowMs(Date.now());
    }, 250);

    const onVisibilityChange = () => {
      setNowMs(Date.now());
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      window.clearInterval(tick);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [state.status]);

  const elapsedMs = useMemo(() => getElapsedMs(state, nowMs), [state, nowMs]);
  const elapsedFormatted = useMemo(() => formatElapsedMs(elapsedMs), [elapsedMs]);

  const value = useMemo<TimerContextValue>(
    () => ({
      elapsedMs,
      elapsedFormatted,
      status: state.status,
      isVisible: state.isVisible,
      start: () => dispatch({ type: 'START', nowMs: Date.now() }),
      pause: () => dispatch({ type: 'PAUSE', nowMs: Date.now() }),
      resume: () => dispatch({ type: 'RESUME', nowMs: Date.now() }),
      stop: () => dispatch({ type: 'STOP' }),
      hide: () => dispatch({ type: 'HIDE' }),
      show: () => dispatch({ type: 'SHOW' }),
    }),
    [elapsedFormatted, elapsedMs, state.isVisible, state.status],
  );

  return <TimerContext.Provider value={value}>{children}</TimerContext.Provider>;
}

export function useTimer() {
  const context = useContext(TimerContext);
  if (!context) {
    throw new Error('useTimer must be used within a TimerProvider');
  }
  return context;
}
