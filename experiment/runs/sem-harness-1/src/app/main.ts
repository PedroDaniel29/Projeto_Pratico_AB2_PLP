import {
  asyncScheduler,
  bufferTime,
  catchError,
  defer,
  EMPTY,
  filter,
  from,
  groupBy,
  mergeMap,
  retry,
  type SchedulerLike,
  timer,
} from 'rxjs';
import type { AlertRaised, SensorReadingReceived } from '../domain/events';
import { isValidReading } from '../domain/events';
import { EventBus } from '../infra/event-bus';

const DEFAULT_THRESHOLD = 80;
const DEFAULT_WINDOW_MS = 5000;
const RETRY_DELAY_MS = 1000;
const MAX_RETRIES = 2;

export interface AlertSink {
  send(alert: AlertRaised): Promise<void>;
}

export interface MonitorDependencies {
  readonly eventBus: EventBus;
  readonly alertSink: AlertSink;
  readonly threshold?: number;
  readonly windowMs?: number;
  readonly scheduler?: SchedulerLike;
}

export interface Monitor {
  stop(): void;
}

export function startMonitor({
  eventBus,
  alertSink,
  threshold = DEFAULT_THRESHOLD,
  windowMs = DEFAULT_WINDOW_MS,
  scheduler = asyncScheduler,
}: MonitorDependencies): Monitor {
  const subscription = eventBus.events$
    .pipe(
      filter(
        (event): event is SensorReadingReceived =>
          event.type === 'SensorReadingReceived' && isValidReading(event),
      ),
      groupBy((reading) => reading.sensorId),
      mergeMap((sensorReadings) => {
        let aboveThreshold = false;

        return sensorReadings.pipe(
          bufferTime(windowMs, scheduler),
          filter((readings) => readings.length > 0),
          mergeMap((readings) => {
            const average =
              readings.reduce((sum, reading) => sum + reading.value, 0) /
              readings.length;

            if (average <= threshold) {
              aboveThreshold = false;
              return EMPTY;
            }

            if (aboveThreshold) {
              return EMPTY;
            }

            aboveThreshold = true;
            const alert: AlertRaised = {
              type: 'AlertRaised',
              sensorId: sensorReadings.key,
              average,
              threshold,
              timestamp: scheduler.now(),
            };

            return defer(() => from(alertSink.send(alert))).pipe(
              retry({
                count: MAX_RETRIES,
                delay: () => timer(RETRY_DELAY_MS, scheduler),
              }),
              catchError(() => EMPTY),
            );
          }),
        );
      }),
    )
    .subscribe();

  return {
    stop: () => subscription.unsubscribe(),
  };
}
