export interface SensorReadingReceived {
  readonly type: 'SensorReadingReceived';
  readonly sensorId: string;
  readonly value: number;
  /** epoch em milissegundos */
  readonly timestamp: number;
}

export interface AlertRaised {
  readonly type: 'AlertRaised';
  readonly sensorId: string;
  readonly average: number;
  readonly threshold: number;
  readonly timestamp: number;
}

export type DomainEvent = SensorReadingReceived | AlertRaised;

/** Função pura: uma leitura é válida se o valor for finito e o id não for vazio. */
export const isValidReading = (event: SensorReadingReceived): boolean =>
  event.sensorId.trim().length > 0 && Number.isFinite(event.value);
