import { BehaviorSubject } from 'rxjs';

export class BehaviorMutable<T> extends BehaviorSubject<T> {
  mutate(mapping: (val: T) => T): void {
    this.next(mapping(this.value));
  }
}
