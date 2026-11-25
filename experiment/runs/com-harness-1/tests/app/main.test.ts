import { describe, expect, it } from 'vitest';
import type { AlertRaised, SensorReadingReceived } from '../../src/domain/events';
import { EventBus } from '../../src/infra/event-bus';
import { startMonitor } from '../../src/app/main';
import { createTestScheduler } from '../helpers/marble';

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

describe('startMonitor', () => {
  it('filtra leituras inválidas, calcula médias por sensor e só alerta em transições', () => {
    const scheduler = createTestScheduler();
    const bus = new EventBus();
    const alerts: AlertRaised[] = [];
    const monitor = startMonitor({
      eventBus: bus,
      alertSink: {
        send: (alert) => {
          alerts.push(alert);
          return Promise.resolve();
        },
      },
      threshold: 80,
      windowMs: 10,
      scheduler,
    });

    scheduler.schedule(() => bus.publish(reading('s1', 100, 1)), 1);
    scheduler.schedule(() => bus.publish(reading('s1', 120, 2)), 2);
    scheduler.schedule(() => bus.publish(reading('s1', Number.NaN, 3)), 3);
    scheduler.schedule(() => bus.publish(reading('s2', 90, 4)), 4);
    scheduler.schedule(() => bus.publish(reading('s3', 90, 5)), 5);
    scheduler.schedule(() => bus.publish(reading('s1', 100, 11)), 11);
    scheduler.schedule(() => bus.publish(reading('s2', 70, 12)), 12);
    scheduler.schedule(() => bus.publish(reading('s3', 80, 13)), 13);
    scheduler.schedule(() => bus.publish(reading('s1', 40, 21)), 21);
    scheduler.schedule(() => bus.publish(reading('s2', 90, 22)), 22);
    scheduler.schedule(() => bus.publish(reading('s3', 90, 23)), 23);
    scheduler.schedule(() => monitor.stop(), 35);
    scheduler.flush();

    expect(alerts).toEqual([
      { type: 'AlertRaised', sensorId: 's1', average: 110, threshold: 80, timestamp: 2 },
      { type: 'AlertRaised', sensorId: 's2', average: 90, threshold: 80, timestamp: 4 },
      { type: 'AlertRaised', sensorId: 's3', average: 90, threshold: 80, timestamp: 5 },
      { type: 'AlertRaised', sensorId: 's2', average: 90, threshold: 80, timestamp: 22 },
    ]);

    bus.publish(reading('s3', 100, 36));
    expect(alerts).toHaveLength(4);
  });

  it('limita retentativas e mantém o monitor ativo após falha do sink', async () => {
    const scheduler = createTestScheduler();
    scheduler.maxFrames = 20;
    const bus = new EventBus();
    const attempts = new Map<string, number>();
    const alerts: AlertRaised[] = [];
    const errors: unknown[] = [];
    const monitor = startMonitor({
      eventBus: bus,
      alertSink: {
        send: (alert) => {
          const count = (attempts.get(alert.sensorId) ?? 0) + 1;
          attempts.set(alert.sensorId, count);
          if (alert.sensorId === 'fails') {
            return Promise.reject(new Error('sink unavailable'));
          }
          alerts.push(alert);
          return Promise.resolve();
        },
      },
      threshold: 80,
      windowMs: 5,
      scheduler,
      onError: (error) => errors.push(error),
    });

    scheduler.schedule(() => bus.publish(reading('fails', 100, 1)), 1);
    scheduler.schedule(() => bus.publish(reading('works', 100, 6)), 6);
    scheduler.flush();

    for (let attempt = 0; attempt < 3; attempt += 1) {
      await Promise.resolve();
      await Promise.resolve();
      scheduler.maxFrames = scheduler.frame + 1000;
      scheduler.flush();
    }
    monitor.stop();

    expect(attempts.get('fails')).toBe(3);
    expect(attempts.get('works')).toBe(1);
    expect(errors).toEqual([new Error('sink unavailable')]);
    expect(alerts).toEqual([
      { type: 'AlertRaised', sensorId: 'works', average: 100, threshold: 80, timestamp: 6 },
    ]);
  });
});
