import { bufferTime, filter, from, map, mergeMap, scan, type Observable, type SchedulerLike } from 'rxjs';
import {
  isValidReading,
  type AlertRaised,
  type DomainEvent,
  type SensorReadingReceived,
} from '../domain/events';

interface SensorAverage {
  readonly sensorId: string;
  readonly average: number;
  readonly timestamp: number;
}

interface AlertState {
  readonly activeSensors: ReadonlySet<string>;
  readonly alerts: readonly AlertRaised[];
}

export const createAlertStream = (
  events$: Observable<DomainEvent>,
  threshold: number,
  windowMs: number,
  scheduler: SchedulerLike,
): Observable<AlertRaised> =>
  events$.pipe(
    filter(
      (event): event is SensorReadingReceived =>
        event.type === 'SensorReadingReceived' && isValidReading(event),
    ),
    bufferTime(windowMs, scheduler),
    map((readings): SensorAverage[] => {
      const totals = new Map<string, { sum: number; count: number; timestamp: number }>();
      for (const reading of readings) {
        const total = totals.get(reading.sensorId);
        if (total) {
          total.sum += reading.value;
          total.count += 1;
          total.timestamp = reading.timestamp;
        } else {
          totals.set(reading.sensorId, {
            sum: reading.value,
            count: 1,
            timestamp: reading.timestamp,
          });
        }
      }

      return [...totals].map(([sensorId, total]) => ({
        sensorId,
        average: total.sum / total.count,
        timestamp: total.timestamp,
      }));
    }),
    scan(
      (state: AlertState, averages: SensorAverage[]): AlertState => {
        const activeSensors = new Set(state.activeSensors);
        const alerts: AlertRaised[] = [];

        for (const { sensorId, average, timestamp } of averages) {
          if (average > threshold) {
            if (!activeSensors.has(sensorId)) {
              alerts.push({
                type: 'AlertRaised',
                sensorId,
                average,
                threshold,
                timestamp,
              });
            }
            activeSensors.add(sensorId);
          } else if (average < threshold) {
            activeSensors.delete(sensorId);
          }
        }

        return { activeSensors, alerts };
      },
      { activeSensors: new Set<string>(), alerts: [] },
    ),
    mergeMap(({ alerts }) => from(alerts)),
  );
