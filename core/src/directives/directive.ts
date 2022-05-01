import { RexNode } from 'core/src/vdom/rexNode';
import { BehaviorSubject, switchMap } from 'rxjs';
import { DependencyResolverReactive } from '../di/dependencyResolverReactive';
import { Ref } from '../scope/ref';

export abstract class Directive<T = string> extends DependencyResolverReactive {
  abstract name: string;
  shorthand: string | null = null;
  valueKey$: BehaviorSubject<string>;
  value$ = new BehaviorSubject<T | null>(null);

  protected get value(): T | null {
    return this.value$.value;
  }

  constructor(key: string) {
    super();
    this.valueKey$ = new BehaviorSubject<string>(key);
    this.valueKey$
      .pipe(
        switchMap((key) => this.resolveReactive<Ref<T>>(key)),
        switchMap((ref) => ref),
      )
      .subscribe((val) => this.value$.next(val));
  }

  protected init(node: RexNode): RexNode | RexNode[] {
    return node;
  }

  __apply__(node: RexNode): RexNode | RexNode[] {
    return this.init(node);
  }
}
