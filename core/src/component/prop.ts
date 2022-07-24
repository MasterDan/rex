import { Subject } from 'rxjs';
import { Ref } from '../state/ref';

export class Prop<T> extends Subject<T> {
  constructor(ref: Ref) {
    super();
    ref.subscribe((val) => {
      this.next(val);
    });
  }
}
