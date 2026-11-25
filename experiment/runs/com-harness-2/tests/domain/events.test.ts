import { describe, expect, it } from 'vitest';
import { isValidReading, type SensorReadingReceived } from '../../src/domain/events';

const reading = (overrides: Partial<SensorReadingReceived> = {}): SensorReadingReceived => ({
  type: 'SensorReadingReceived',
  sensorId: 's1',
  value: 10,
  timestamp: 0,
  ...overrides,
});

describe('isValidReading', () => {
  it('aceita leitura normal', () => {
    expect(isValidReading(reading())).toBe(true);
  });

  it('rejeita NaN e Infinity', () => {
    expect(isValidReading(reading({ value: Number.NaN }))).toBe(false);
    expect(isValidReading(reading({ value: Number.POSITIVE_INFINITY }))).toBe(false);
  });

  it('rejeita sensorId vazio', () => {
    expect(isValidReading(reading({ sensorId: '  ' }))).toBe(false);
  });
});
