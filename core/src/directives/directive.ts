import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  pairwise,
  startWith,
  switchMap,
} from 'rxjs';
import { htmlElementsKey } from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainerReactive } from '../di/diContainerReactive';
import { Ref } from '../scope/ref';
import { RexNode } from '../vdom/rexNode';

export interface IDirectiveBinding<T = string> {
  argument: string | null;
  value: T | null;
  oldValue: T | null;
  modifiers: Record<string, boolean> | null;
}

export interface IElems {
  element: HTMLElement;
  elements: HTMLElement[];
}

/**
  Directive is a thing that transforms our tree and detects changes
 */
export abstract class Directive<T = string> extends DependencyResolver {
  protected frame: RegExp | null = null;
  abstract name: string;

  __argument$ = new BehaviorSubject<string | null>(null);
  __modifiers$ = new BehaviorSubject<Record<string, boolean> | null>(null);

  __sourceNode$ = new BehaviorSubject<RexNode | null>(null);
  __transformedNode$ = new BehaviorSubject<RexNode | RexNode[] | null>(null);
  __valueKey$: BehaviorSubject<string | null>;
  __value$ = new BehaviorSubject<T | null>(null);
  __valueOld$ = new BehaviorSubject<T | null>(null);
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

  get binding(): IDirectiveBinding<T> {
    return {
      argument: this.__argument$.value,
      modifiers: this.__modifiers$.value,
      oldValue: this.__valueOld$.value,
      value: this.__value$.value,
    };
  }

  constructor(key: string | null = null) {
    super();
    this.__valueKey$ = new BehaviorSubject<string | null>(key);
    // resolving and unwrapping value
    this.__valueKey$
      .pipe(
        filter((s): s is string => s != null),
        switchMap((key) => this.resolveReactive<Ref<T>>(key)),
        switchMap((ref) =>
          ref.pipe(distinctUntilChanged(), startWith(null), pairwise()),
        ),
      )
      .subscribe(([oldval, val]) => {
        this.__value$.next(val);
        this.__valueOld$.next(oldval);
      });
    // triggering update
    combineLatest([
      this.__transformedElements$.pipe(
        map(
          (els) =>
            <IElems>{
              element: els.length === 1 ? els[0] : null,
              elements: els,
            },
        ),
      ),
      this.__value$,
    ]).subscribe(([elems]) => {
      this.update(elems, this.binding);
    });
  }

  /** Detects if current directive (if not template string) exists in provideded node.
   *  May be more, than once.
   */
  __detectSelfIn(node: RexNode): Directive[] | null {
    const attrs = node.attributes$.value;
    if (attrs == null) {
      return null;
    }
    let notFoundSelf = true;
    const foundedSelf: Directive[] = [];
    for (const attributeName of Object.keys(attrs)) {
      const fallbackRegExp = new RegExp(`rex-${this.name}:(\\w*)`);
      const match =
        this.frame != null
          ? this.frame.exec(attributeName) ?? fallbackRegExp.exec(attributeName)
          : fallbackRegExp.exec(attributeName);
      if (match == null) {
        continue;
      } else {
        this.resolve<Directive>(this.name).subscribe((directive) => {
          notFoundSelf = false;
          const argumentDetected = match[1];
          if (argumentDetected != null) {
            directive.__argument$.next(argumentDetected);
          }
          directive.__valueKey$.next(attrs[attributeName]);
          foundedSelf.push(directive);
          node.attributes$.mutate((val) => {
            if (val != null) {
              delete val[attributeName];
            }
            return val;
          });
        });
      }
    }
    if (notFoundSelf) {
      return null;
    } else {
      return foundedSelf;
    }
  }

  abstract init(
    node: RexNode,
    binding: IDirectiveBinding<T>,
  ): RexNode | RexNode[];

  abstract update(elems: IElems, binding: IDirectiveBinding<T>): HTMLElement[];

  __apply(node: RexNode): RexNode | RexNode[] {
    if (this.__initialized) {
      throw new Error(
        `Attempt to initialize already initialized directive ${this.name}.`,
      );
    }
    this.__sourceNode$.next(node);
    const transformed = this.init(
      node.clone({ skipDirectivesResolve: true }),
      this.binding,
    );
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
