import {
  EMPTY,
  Subscription,
  asyncScheduler,
  catchError,
  defer,
  from,
  mergeMap,
  retry,
  timer,
  type SchedulerLike,
} from 'rxjs';
import type { AlertRaised } from '../domain/events';
import { EventBus } from '../infra/event-bus';
import { createAlertStream } from '../streams/alert-stream';

const DEFAULT_THRESHOLD = 80;
const DEFAULT_WINDOW_MS = 5000;
const RETRY_DELAY_MS = 1000;
const MAX_SEND_ATTEMPTS = 3;

export interface AlertSink {
  send(alert: AlertRaised): Promise<void>;
}

export interface MonitorDependencies {
  readonly eventBus: EventBus;
  readonly alertSink: AlertSink;
  readonly threshold?: number;
  readonly windowMs?: number;
  readonly scheduler?: SchedulerLike;
  readonly onError?: (error: unknown) => void;
}

export interface Monitor {
  stop(): void;
}

export const startMonitor = (deps: MonitorDependencies): Monitor => {
  const scheduler = deps.scheduler ?? asyncScheduler;
  const alertStream = createAlertStream(deps.eventBus.events$, {
    threshold: deps.threshold ?? DEFAULT_THRESHOLD,
    windowMs: deps.windowMs ?? DEFAULT_WINDOW_MS,
    scheduler,
  });

  const subscription: Subscription = alertStream
    .pipe(
      mergeMap((alert) =>
        defer(() => from(deps.alertSink.send(alert))).pipe(
          retry({
            count: MAX_SEND_ATTEMPTS - 1,
            delay: () => timer(RETRY_DELAY_MS, scheduler),
          }),
          catchError((error: unknown) => {
            deps.onError?.(error);
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe({
      error: (error: unknown) => deps.onError?.(error),
    });

  return {
    stop: () => subscription.unsubscribe(),
  };
};
