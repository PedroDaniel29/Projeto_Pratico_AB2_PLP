import { asyncScheduler, catchError, defer, EMPTY, from, mergeMap, retry, Subscription, timer } from 'rxjs';
import type { SchedulerLike } from 'rxjs';
import type { AlertRaised } from '../domain/events';
import { EventBus } from '../infra/event-bus';
import { createAlertStream } from '../streams/sensor-alerts';

const RETRY_DELAY_MS = 1000;

export interface MonitorDependencies {
  readonly eventBus: EventBus;
  readonly alertSink: { send(alert: AlertRaised): Promise<void> };
  readonly threshold?: number;
  readonly windowMs?: number;
  readonly scheduler?: SchedulerLike;
  readonly onError?: (error: unknown) => void;
}

export interface Monitor {
  stop(): void;
}

export const startMonitor = ({
  eventBus,
  alertSink,
  threshold = 80,
  windowMs = 5000,
  scheduler = asyncScheduler,
  onError,
}: MonitorDependencies): Monitor => {
  const subscription: Subscription = createAlertStream(
    eventBus.events$,
    threshold,
    windowMs,
    scheduler,
  )
    .pipe(
      mergeMap((alert) =>
        defer(() => from(alertSink.send(alert))).pipe(
          retry({
            count: 2,
            delay: () => timer(RETRY_DELAY_MS, scheduler),
          }),
          catchError((error: unknown) => {
            onError?.(error);
            return EMPTY;
          }),
        ),
      ),
    )
    .subscribe({
      error: (error: unknown) => onError?.(error),
    });

  return {
    stop: () => subscription.unsubscribe(),
  };
};
