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
  protected shorthand: string | null = null;

  __sourceNode$ = new BehaviorSubject<RexNode | null>(null);
  __transformedNode$ = new BehaviorSubject<RexNode | RexNode[] | null>(null);
  __valueKey$: BehaviorSubject<string | null>;
  __value$ = new BehaviorSubject<T | null>(null);
  __initialized = false;

  constructor(key: string | null = null) {
    super();
    this.__valueKey$ = new BehaviorSubject<string | null>(key);
    // resolving and unwrapping value
    this.__valueKey$
      .pipe(
        filter((s): s is string => s != null),
        switchMap((key) => this.resolveReactive<Ref<T>>(key)),
        switchMap((ref) => ref),
      )
      .subscribe((val) => this.__value$.next(val));
  }

  abstract init(node: RexNode): RexNode | RexNode[];

  __apply(node: RexNode): RexNode | RexNode[] {
    if (this.__initialized) {
      throw new Error(
        `Attempt to initialize already initialized directive ${this.name}.`,
      );
    }
    this.__sourceNode$.next(node);
    const transformed = this.init(node.clone({ skipDirectivesResolve: true }));
    if (transformed instanceof RexNode) {
      transformed._updatable$.next(true);
    } else {
      for (const current of transformed as RexNode[]) {
        current._updatable$.next(true);
      }
    }
    this.__transformedNode$.next(transformed);
    this.__initialized = true;
    return transformed;
  }
}
