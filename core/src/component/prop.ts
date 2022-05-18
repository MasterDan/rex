import { Subject } from 'rxjs';
import { Ref } from '../scope/ref';

export class Prop<T> extends Subject<T> {
  constructor(ref: Ref) {
    super();
    ref.subscribe((val) => {
      this.next(val);
    });
  }
}
