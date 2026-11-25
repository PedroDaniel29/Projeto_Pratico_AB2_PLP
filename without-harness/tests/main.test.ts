import { afterEach, describe, expect, it, vi } from 'vitest';
import { startMonitor, type AlertSink } from '../src/app/main';
import type { AlertRaised, SensorReadingReceived } from '../src/domain/events';
import { EventBus } from '../src/infra/event-bus';

const reading = (
  sensorId: string,
  value: number,
): SensorReadingReceived => ({
  type: 'SensorReadingReceived',
  sensorId,
  value,
  timestamp: Date.now(),
});

afterEach(() => {
  vi.useRealTimers();
});

describe('startMonitor', () => {
  it('filters invalid readings and alerts only when a sensor average exceeds the threshold', async () => {
    vi.useFakeTimers();
    const eventBus = new EventBus();
    const alerts: AlertRaised[] = [];
    const monitor = startMonitor({
      eventBus,
      alertSink: { send: async (alert) => void alerts.push(alert) },
      threshold: 80,
      windowMs: 10,
    });

    eventBus.publish(reading('average-at-threshold', 100));
    eventBus.publish(reading('average-at-threshold', 60));
    eventBus.publish(reading('above-threshold', 90));
    eventBus.publish(reading('above-threshold', 110));
    eventBus.publish(reading('', 100));
    eventBus.publish(reading('invalid-value', Number.NaN));

    await vi.advanceTimersByTimeAsync(10);

    expect(alerts).toHaveLength(1);
    expect(alerts[0]).toMatchObject({
      type: 'AlertRaised',
      sensorId: 'above-threshold',
      average: 100,
      threshold: 80,
    });

    monitor.stop();
  });

  it('suppresses repeat alerts until a window average returns to the threshold or below', async () => {
    vi.useFakeTimers();
    const eventBus = new EventBus();
    const alerts: AlertRaised[] = [];
    const monitor = startMonitor({
      eventBus,
      alertSink: { send: async (alert) => void alerts.push(alert) },
      threshold: 80,
      windowMs: 10,
    });

    eventBus.publish(reading('sensor-1', 100));
    await vi.advanceTimersByTimeAsync(10);
    eventBus.publish(reading('sensor-1', 120));
    await vi.advanceTimersByTimeAsync(10);
    expect(alerts).toHaveLength(1);

    eventBus.publish(reading('sensor-1', 80));
    await vi.advanceTimersByTimeAsync(10);
    eventBus.publish(reading('sensor-1', 90));
    await vi.advanceTimersByTimeAsync(10);

    expect(alerts).toHaveLength(2);
    expect(alerts.map(({ average }) => average)).toEqual([100, 90]);
    monitor.stop();
  });

  it('retries failed sends three times without blocking other sensors', async () => {
    vi.useFakeTimers();
    const eventBus = new EventBus();
    const attempts = new Map<string, number>();
    const alerts: AlertRaised[] = [];
    const alertSink: AlertSink = {
      send: async (alert) => {
        const attempt = (attempts.get(alert.sensorId) ?? 0) + 1;
        attempts.set(alert.sensorId, attempt);
        if (alert.sensorId === 'failing-sensor') {
          throw new Error('send failed');
        }
        alerts.push(alert);
      },
    };
    const monitor = startMonitor({ eventBus, alertSink, windowMs: 10 });

    eventBus.publish(reading('failing-sensor', 100));
    eventBus.publish(reading('working-sensor', 100));
    await vi.advanceTimersByTimeAsync(2010);

    expect(attempts.get('failing-sensor')).toBe(3);
    expect(attempts.get('working-sensor')).toBe(1);
    expect(alerts.map(({ sensorId }) => sensorId)).toEqual(['working-sensor']);

    monitor.stop();
  });

  it('stops processing and cancels pending window work', async () => {
    vi.useFakeTimers();
    const eventBus = new EventBus();
    const send = vi.fn(async (_alert: AlertRaised) => {});
    const monitor = startMonitor({
      eventBus,
      alertSink: { send },
      windowMs: 10,
    });

    eventBus.publish(reading('sensor-1', 100));
    monitor.stop();
    await vi.advanceTimersByTimeAsync(20);

    expect(send).not.toHaveBeenCalled();
  });
});
