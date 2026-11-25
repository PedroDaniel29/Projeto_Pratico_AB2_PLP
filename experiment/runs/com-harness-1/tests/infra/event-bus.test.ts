import { firstValueFrom } from 'rxjs';
import { describe, expect, it } from 'vitest';
import type { DomainEvent } from '../../src/domain/events';
import { EventBus } from '../../src/infra/event-bus';

describe('EventBus', () => {
  it('entrega eventos publicados aos inscritos', async () => {
    const bus = new EventBus();
    const next = firstValueFrom(bus.events$);
    const event: DomainEvent = { type: 'SensorReadingReceived', sensorId: 's1', value: 1, timestamp: 0 };

    bus.publish(event);

    await expect(next).resolves.toEqual(event);
  });
});
