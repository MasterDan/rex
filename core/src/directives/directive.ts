import { BehaviorSubject, filter, switchMap } from 'rxjs';
import { DependencyResolverReactive } from '../di/dependencyResolverReactive';
import { Ref } from '../scope/ref';
import { RexNode } from '../vdom/rexNode';
/**
 * В общем виде директива - это штука, которая обновляет наше дерево
 * Мы не ищем вершины, требующие обновления явно. Всё нелбходимое уже должно быть
 * в директиве.
 *
 */
export abstract class Directive<T = string> extends DependencyResolverReactive {
  abstract name: string;
  shorthand: string | null = null;

  _sourceNode$ = new BehaviorSubject<RexNode | null>(null);
  valueKey$: BehaviorSubject<string | null>;
  value$ = new BehaviorSubject<T | null>(null);
  _initialized = false;

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

  __apply(node: RexNode): RexNode | RexNode[] {
    if (this._initialized) {
      throw new Error(
        `Attempt to initialize already initialized directive ${this.name}. Something went wrong.`,
      );
    }
    this._sourceNode$.next(node);
    this._initialized = true;
    const nodesToReturn = this.init(node);
    if (node instanceof RexNode) {
      node._updatable$.next(true);
    } else {
      for (const current of node as RexNode[]) {
        current._updatable$.next(true);
      }
    }
    return nodesToReturn;
  }
}
