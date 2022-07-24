import { BehaviorSubject, Observable } from 'rxjs';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export class Ref<T = any> extends BehaviorSubject<T | null> {
  constructor(from: Observable<T> | T, fallback: T | null = null) {
    if (from instanceof Observable) {
      super(fallback);
      from.subscribe((val) => this.next(val));
    } else {
      super(from);
    }
  }
}
