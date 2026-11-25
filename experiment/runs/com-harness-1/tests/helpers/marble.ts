import { TestScheduler } from 'rxjs/testing';
import { expect } from 'vitest';

/** TestScheduler pronto para marble tests (debounce, buffer, retry...). */
export const createTestScheduler = (): TestScheduler =>
  new TestScheduler((actual, expected) => {
    expect(actual).toEqual(expected);
  });
