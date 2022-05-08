import { RexNode } from 'core/src/vdom/rexNode';
import { BehaviorSubject, filter, switchMap } from 'rxjs';
import { DependencyResolverReactive } from '../di/dependencyResolverReactive';
import { Ref } from '../scope/ref';

export abstract class Directive<T = string> extends DependencyResolverReactive {
  abstract name: string;
  shorthand: string | null = null;
  valueKey$: BehaviorSubject<string | null>;
  value$ = new BehaviorSubject<T | null>(null);

  protected get value(): T | null {
    return this.value$.value;
  }

  constructor(key: string | null = null) {
    super();
    this.valueKey$ = new BehaviorSubject<string | null>(key);
    // resolving and unwrapping value
    this.valueKey$
      .pipe(
        filter((s): s is string => s != null),
        switchMap((key) => this.resolveReactive<Ref<T>>(key)),
        switchMap((ref) => ref),
      )
      .subscribe((val) => this.value$.next(val));
  }

  init(node: RexNode): RexNode | RexNode[] {
    return node;
  }
}
