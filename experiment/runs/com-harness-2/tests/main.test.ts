import { describe, expect, it, vi } from 'vitest';
import { TestScheduler } from 'rxjs/testing';
import type { SensorReadingReceived } from '../src/domain/events';
import { EventBus } from '../src/infra/event-bus';
import { startMonitor } from '../src/app/main';

const reading = (value: number, timestamp: number): SensorReadingReceived => ({
  type: 'SensorReadingReceived',
  sensorId: 's1',
  value,
  timestamp,
});

describe('startMonitor', () => {
  it('tenta enviar cada alerta no máximo três vezes e continua após falha definitiva', async () => {
    const scheduler = new TestScheduler(() => undefined);
    const bus = new EventBus();
    const onError = vi.fn();
    let attempts = 0;
    const monitor = startMonitor({
      eventBus: bus,
      alertSink: {
        send: () => {
          attempts += 1;
          return attempts <= 3 ? Promise.reject(new Error('sink indisponível')) : Promise.resolve();
        },
      },
      threshold: 10,
      windowMs: 5,
      scheduler,
      onError,
    });

    scheduler.schedule(() => bus.publish(reading(12, 0)), 0);
    scheduler.maxFrames = 5;
    scheduler.flush();
    expect(attempts).toBe(1);

    await Promise.resolve();
    scheduler.maxFrames = 1005;
    scheduler.flush();
    expect(attempts).toBe(2);

    await Promise.resolve();
    scheduler.maxFrames = 2005;
    scheduler.flush();
    expect(attempts).toBe(3);

    await Promise.resolve();
    expect(onError).toHaveBeenCalledTimes(1);

    scheduler.schedule(() => bus.publish(reading(0, 2006)), 1);
    scheduler.schedule(() => bus.publish(reading(12, 2012)), 7);
    scheduler.maxFrames = 2015;
    scheduler.flush();
    expect(attempts).toBe(4);
    await Promise.resolve();

    monitor.stop();
    bus.shutdown();
  });

  it('encerra a assinatura e cancela janelas pendentes ao parar', () => {
    const scheduler = new TestScheduler(() => undefined);
    const bus = new EventBus();
    const send = vi.fn(() => Promise.resolve());
    const monitor = startMonitor({
      eventBus: bus,
      alertSink: { send },
      threshold: 10,
      windowMs: 5,
      scheduler,
    });

    scheduler.schedule(() => bus.publish(reading(12, 0)), 0);
    scheduler.schedule(() => monitor.stop(), 2);
    scheduler.schedule(() => bus.publish(reading(15, 8)), 8);
    scheduler.maxFrames = 20;
    scheduler.flush();

    expect(send).not.toHaveBeenCalled();
    bus.shutdown();
  });
});
