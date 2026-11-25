import { describe, it } from 'vitest';
import type { SensorReadingReceived } from '../src/domain/events';
import { createTestScheduler } from './helpers/marble';
import { createAlertStream } from '../src/streams/alert-stream';

const reading = (
  sensorId: string,
  value: number,
  timestamp: number,
): SensorReadingReceived => ({
  type: 'SensorReadingReceived',
  sensorId,
  value,
  timestamp,
});

describe('createAlertStream', () => {
  it('calcula médias por sensor, ignora leituras inválidas e rearma após ficar abaixo do limiar', () => {
    const scheduler = createTestScheduler();
    const firstAlert = {
      type: 'AlertRaised',
      sensorId: 's1',
      average: 13,
      threshold: 10,
      timestamp: 2,
    } as const;
    const secondAlert = {
      type: 'AlertRaised',
      sensorId: 's1',
      average: 15,
      threshold: 10,
      timestamp: 20,
    } as const;

    scheduler.run(({ hot, expectObservable }) => {
      const readings = hot('a-bxg--c-d----e-----f----|', {
        a: reading('s1', 12, 0),
        b: reading('s1', 14, 2),
        x: reading('s1', Number.NaN, 3),
        g: reading('s2', 1, 4),
        c: reading('s1', 16, 7),
        d: reading('s1', 18, 9),
        e: reading('s1', 4, 14),
        f: reading('s1', 15, 20),
      });

      expectObservable(
        createAlertStream(readings, {
          threshold: 10,
          windowMs: 6,
          scheduler,
        }),
      ).toBe(`${'-'.repeat(6)}a${'-'.repeat(17)}b|`, {
        a: firstAlert,
        b: secondAlert,
      });
    });
  });
});
