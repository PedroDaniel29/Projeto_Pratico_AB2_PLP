import {
  asyncScheduler,
  bufferTime,
  filter,
  from,
  groupBy,
  map,
  mergeMap,
  scan,
  toArray,
  type Observable,
  type SchedulerLike,
} from 'rxjs';
import {
  isValidReading,
  type AlertRaised,
  type DomainEvent,
  type SensorReadingReceived,
} from '../domain/events';

export interface AlertStreamOptions {
  readonly threshold: number;
  readonly windowMs: number;
  readonly scheduler?: SchedulerLike;
}

interface SensorAverage {
  readonly sensorId: string;
  readonly average: number;
  readonly timestamp: number;
}

interface AlertState {
  readonly aboveThresholdBySensor: Map<string, boolean>;
  readonly alert: AlertRaised | null;
}

const isReading = (event: DomainEvent): event is SensorReadingReceived =>
  event.type === 'SensorReadingReceived';

export const createAlertStream = (
  events$: Observable<DomainEvent>,
  options: AlertStreamOptions,
): Observable<AlertRaised> => {
  const scheduler = options.scheduler ?? asyncScheduler;

  return events$.pipe(
    filter(isReading),
    filter(isValidReading),
    bufferTime(options.windowMs, undefined, Infinity, scheduler),
    mergeMap((window) =>
      from(window).pipe(
        groupBy((reading) => reading.sensorId),
        mergeMap((sensorReadings) =>
          sensorReadings.pipe(
            toArray(),
            map((readings): SensorAverage => ({
              sensorId: sensorReadings.key,
              average:
                readings.reduce((total, reading) => total + reading.value, 0) /
                readings.length,
              timestamp: Math.max(...readings.map((reading) => reading.timestamp)),
            })),
          ),
        ),
      ),
    ),
    scan(
      (state, sensorAverage): AlertState => {
        const wasAboveThreshold =
          state.aboveThresholdBySensor.get(sensorAverage.sensorId) ?? false;
        const isAboveThreshold = sensorAverage.average > options.threshold;
        state.aboveThresholdBySensor.set(sensorAverage.sensorId, isAboveThreshold);

        return {
          aboveThresholdBySensor: state.aboveThresholdBySensor,
          alert:
            isAboveThreshold && !wasAboveThreshold
              ? {
                  type: 'AlertRaised',
                  sensorId: sensorAverage.sensorId,
                  average: sensorAverage.average,
                  threshold: options.threshold,
                  timestamp: sensorAverage.timestamp,
                }
              : null,
        };
      },
      { aboveThresholdBySensor: new Map<string, boolean>(), alert: null },
    ),
    filter((state): state is AlertState & { readonly alert: AlertRaised } => state.alert !== null),
    map((state) => state.alert),
  );
};
