import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  switchMap,
} from 'rxjs';
import { htmlElementsKey } from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainerReactive } from '../di/diContainerReactive';
import { Ref } from '../scope/ref';
import { RexNode } from '../vdom/rexNode';
/**
  Directive is a thing that transforms our tree and detects changes
 */
export abstract class Directive<T = string> extends DependencyResolver {
  abstract name: string;
  protected shorthand: string | null = null;

  __sourceNode$ = new BehaviorSubject<RexNode | null>(null);
  __transformedNode$ = new BehaviorSubject<RexNode | RexNode[] | null>(null);
  __valueKey$: BehaviorSubject<string | null>;
  __value$ = new BehaviorSubject<T | null>(null);
  __initialized = false;

  __transformedElements$: Observable<HTMLElement[]> =
    this.__transformedNode$.pipe(
      filter((val): val is RexNode | RexNode[] => val != null),
      map((tn) => {
        if (tn instanceof RexNode) {
          return [tn];
        }
      }),
      filter((nodes): nodes is RexNode[] => nodes != undefined),
      switchMap((nodes) => {
        return combineLatest(
          nodes.map((node) =>
            node._id$.pipe(
              filter((id): id is string => id != null),
              switchMap((id) =>
                this.resolve<DiContainerReactive>(htmlElementsKey).pipe(
                  switchMap((htmlDi) =>
                    htmlDi.resolveReactive<HTMLElement>(id),
                  ),
                  filter((el): el is HTMLElement => el != null),
                ),
              ),
            ),
          ),
        );
      }),
    );

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
    // triggering update
    combineLatest([
      this.__transformedElements$,
      this.__value$.pipe(filter((val): val is T => val != null)),
    ]).subscribe(([elems, value]) => {
      this.update(value, elems);
    });
  }

  abstract init(node: RexNode): RexNode | RexNode[];

  abstract update(value: T, elems: HTMLElement[]): HTMLElement[];

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
