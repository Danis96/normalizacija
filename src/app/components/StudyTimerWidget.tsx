import { useEffect, useMemo, useState } from 'react';
import { Pause, Play, Square, X } from 'lucide-react';
import { Button } from './ui/button';
import { CardContent } from './ui/card';
import { cn } from './ui/utils';
import { useTimer } from '../timer/TimerContext';
import styles from './StudyTimerWidget.module.css';

const EXIT_DURATION_MS = 220;

export function StudyTimerWidget() {
  const {
    elapsedFormatted,
    status,
    isVisible,
    start,
    pause,
    resume,
    stop,
    hide,
  } = useTimer();

  const [rendered, setRendered] = useState(isVisible);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setRendered(true);
      const animationFrame = window.requestAnimationFrame(() => {
        setIsExiting(false);
      });
      return () => window.cancelAnimationFrame(animationFrame);
    }

    if (!rendered) {
      return;
    }

    setIsExiting(true);
    const timeout = window.setTimeout(() => {
      setRendered(false);
    }, EXIT_DURATION_MS);

    return () => window.clearTimeout(timeout);
  }, [isVisible, rendered]);

  const statusLabel = useMemo(() => {
    if (status === 'running') return 'Running';
    if (status === 'paused') return 'Paused';
    return 'Idle';
  }, [status]);

  if (!rendered) {
    return null;
  }

  return (
    <div
      className={cn(
        styles.widget,
        isExiting ? styles.exit : styles.enter,
        status === 'running' && styles.running,
      )}
      role="region"
      aria-label="Global timer widget"
    >
      <CardContent className="p-4 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-[#5a4b62]">Global Timer</p>
            <p className="text-3xl font-bold text-[#2a2334] leading-none tabular-nums">{elapsedFormatted}</p>
          </div>
          <Button
            size="icon"
            variant="ghost"
            className="h-8 w-8"
            onClick={hide}
            aria-label="Hide timer widget"
            title="Hide timer"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-xs text-[#5a4b62] font-semibold">
          <span
            className={cn(
              styles.statusDot,
              status === 'running'
                ? styles.statusRunning
                : status === 'paused'
                  ? styles.statusPaused
                  : styles.statusIdle,
            )}
            aria-hidden="true"
          />
          <span>{statusLabel}</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          {status === 'running' ? (
            <Button
              size="sm"
              onClick={pause}
              className="bg-[#b9a7de] hover:bg-[#d1c0f1]"
              aria-label="Pause timer"
            >
              <Pause className="w-4 h-4 mr-1" />
              Pause
            </Button>
          ) : status === 'paused' ? (
            <Button
              size="sm"
              onClick={resume}
              className="bg-[#b8df69] hover:bg-[#c9ef7a]"
              aria-label="Resume timer"
            >
              <Play className="w-4 h-4 mr-1" />
              Resume
            </Button>
          ) : (
            <Button
              size="sm"
              onClick={start}
              className="bg-[#b8df69] hover:bg-[#c9ef7a]"
              aria-label="Start timer"
            >
              <Play className="w-4 h-4 mr-1" />
              Start
            </Button>
          )}

          <Button
            size="sm"
            variant="outline"
            onClick={stop}
            aria-label="Stop timer"
          >
            <Square className="w-4 h-4 mr-1" />
            Stop
          </Button>
        </div>
      </CardContent>
    </div>
  );
}
