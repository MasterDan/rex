import { BehaviorSubject, Observable } from 'rxjs';

export class Ref<T = unknown> extends BehaviorSubject<T | null> {
  constructor(from: Observable<T> | T, fallback: T | null = null) {
    if (from instanceof Observable) {
      super(fallback);
      from.subscribe((val) => this.next(val));
    } else {
      super(from);
    }
  }
}
