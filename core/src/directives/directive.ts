import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  Observable,
  of,
  pairwise,
  skip,
  startWith,
  switchMap,
  take,
} from 'rxjs';
import { htmlElementsKey } from '../di/constants';
import { DependencyResolver } from '../di/dependencyResolver';
import { DiContainerReactive } from '../di/diContainerReactive';
import { Ref } from '../scope/ref';
import { isNullOrWhiteSpace } from '../tools/stringTools';
import { RexNode } from '../domPrototype/rexNode';

export interface IDirectiveBinding<T = string> {
  argument: string | null;
  value: T | null;
  oldValue: T | null;
  modifiers: Record<string, boolean> | null;
}

export interface IElems {
  parent: HTMLElement | null;
  element: HTMLElement | null;
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
  __transformedNode$ = new BehaviorSubject<RexNode[] | null>(null);
  __valueKey$: BehaviorSubject<string | null>;
  __value$ = new BehaviorSubject<T | null>(null);
  __valueOld$ = new BehaviorSubject<T | null>(null);
  __initialized = false;

  __transformedElements$ = new BehaviorSubject<HTMLElement[] | null>(null);
  __parentElement$ = new BehaviorSubject<HTMLElement | null>(null);

  /** Value changed and we have Element(s) to apply changes */
  __readyToUpdate$: Observable<[IElems, T | null]> = combineLatest([
    this.__transformedElements$,
    this.__parentElement$,
    this.__value$,
  ]).pipe(
    filter(([els]) => {
      return els != null;
    }),
    map(([els, parent, value]) => [
      {
        element: els != null && els.length === 1 ? els[0] : null,
        parent,
        elements: els,
      } as IElems,
      value,
    ]),
  );

  get __binding(): IDirectiveBinding<T> {
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
    /* try to resolve current element */
    this.__findHtml(this.__transformedNode$).subscribe((el) =>
      this.__transformedElements$.next(el),
    );
    /* and parent element */
    this.__sourceNode$
      .pipe(
        filter((n): n is RexNode => n != null),
        switchMap((node) => node._parentNode$),
        filter((n): n is RexNode => n != null),
        switchMap((n) => this.__findHtml(of([n]))),
      )
      .subscribe(([el]) => this.__parentElement$.next(el));

    // triggering update
    this.__readyToUpdate$.pipe(skip(1)).subscribe(([elems]) => {
      this.update(elems, this.__binding);
    });
    // first update is mounted
    this.__readyToUpdate$.pipe(take(1)).subscribe(([elems]) => {
      this.mounted(elems, this.__binding);
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
      const fallbackRegExp = new RegExp(`rex-${this.name}:([\\w-]*)`);
      const match =
        this.frame != null
          ? this.frame.exec(attributeName)
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

  __findHtml(
    nodeSubject: Observable<RexNode[] | null>,
  ): Observable<HTMLElement[]> {
    return nodeSubject.pipe(
      filter((val): val is RexNode[] => val != null),
      switchMap((nodes) => {
        return combineLatest(
          nodes
            .filter((node) => !isNullOrWhiteSpace(node.tag$.value))
            .map((node) =>
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
  }

  abstract init(node: RexNode, binding: IDirectiveBinding<T>): RexNode[];

  protected mounted(
    elems: IElems,
    binding: IDirectiveBinding<T>,
  ): HTMLElement[] {
    return this.update(elems, binding);
  }

  abstract update(elems: IElems, binding: IDirectiveBinding<T>): HTMLElement[];

  __applySafe(node: RexNode): RexNode[] {
    if (this.__initialized && this.__transformedNode$.value != null) {
      return this.__transformedNode$.value;
    } else {
      return this.__apply(node);
    }
  }

  /** @todo move comment zone to pipeline */
  __apply(node: RexNode): RexNode[] {
    if (this.__initialized) {
      throw new Error(
        `Attempt to initialize already initialized directive ${this.name}.`,
      );
    }
    this.__sourceNode$.next(node);
    const transformed = this.init(
      /* Preventing endless loop of detecting directives in Node */
      node.clone({ skipDirectivesResolve: true }),
      this.__binding,
    );
    //
    // if (transformed.length === 0) {
    //   this.__sourceNode$
    //     .pipe(
    //       filter((n): n is RexNode => n != null),
    //       switchMap((n) => n._parentNode$),
    //       filter((n): n is RexNode => n != null),
    //       take(1),
    //     )
    //     .subscribe((n) => {
    //       n._updatable$.next(true);
    //     });
    // } else {
    //   for (const current of transformed) {
    //     current._updatable$.next(true);
    //   }
    // }

    this.__transformedNode$.next(transformed);
    this.__initialized = true;
    return transformed;
  }
}
