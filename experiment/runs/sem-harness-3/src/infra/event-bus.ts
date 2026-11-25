import { Observable, Subject } from 'rxjs';
import type { DomainEvent } from '../domain/events';

/**
 * Barramento de eventos. O Subject é privado; o mundo externo só vê Observable.
 */
export class EventBus {
  private readonly subject = new Subject<DomainEvent>();

  readonly events$: Observable<DomainEvent> = this.subject.asObservable();

  publish(event: DomainEvent): void {
    this.subject.next(event);
  }

  shutdown(): void {
    this.subject.complete();
  }
}
