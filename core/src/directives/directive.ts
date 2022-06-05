import {
  BehaviorSubject,
  combineLatest,
  distinctUntilChanged,
  filter,
  map,
  pairwise,
  startWith,
  switchMap,
} from 'rxjs';
import { DependencyResolver } from '../di/dependencyResolver';
import { Ref } from '../scope/ref';
import { RexNode } from '../domPrototype/rexNode';
import { IElems } from './@types/IElems';
import { IDirectiveBinding } from './@types/IDirectiveBinding';

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

  __isTheSameElement$ = combineLatest([
    this.__sourceNode$,
    this.__transformedNode$,
  ]).pipe(
    filter((arr): arr is [RexNode, RexNode[]] => {
      const [was, now] = arr;
      return was != null && now != null;
    }),
    map(([was, now]) => now.length === 1 && was.compare(now[0])),
  );

  /** Value changed and we have Element(s) to apply changes */
  // __readyToUpdate$: Observable<[IElems, T | null]> = combineLatest([
  //   this.__transformedElements$,
  //   this.__parentElement$,
  //   this.__value$,
  // ]).pipe(
  //   filter(([els]) => {
  //     return els != null;
  //   }),
  //   map(([els, parent, value]) => [
  //     {
  //       element: els != null && els.length === 1 ? els[0] : null,
  //       parent,
  //       elements: els,
  //     } as IElems,
  //     value,
  //   ]),
  // );

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
    /* When key is set - getting value of that key */
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

    /* triggering update */
    // this.__readyToUpdate$.pipe(skip(1)).subscribe(([elems]) => {
    //   this.update(elems, this.__binding);
    // });
    /* first update is mounted */
    // this.__readyToUpdate$.pipe(take(1)).subscribe(([elems]) => {
    //   this.mounted(elems, this.__binding);
    // });
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

  /** triggering update from pipeline */
  __triggerUpdate(elems: IElems): Array<HTMLElement | RexNode> {
    return this.update(elems, this.__binding);
  }

  /** triggering mounted from pipeline */
  __triggerMounted(elems: IElems): Array<HTMLElement | RexNode> {
    return this.mounted(elems, this.__binding);
  }

  abstract init(node: RexNode, binding: IDirectiveBinding<T>): RexNode[];

  protected mounted(
    elems: IElems,
    binding: IDirectiveBinding<T>,
  ): Array<HTMLElement | RexNode> {
    return this.update(elems, binding);
  }

  abstract update(
    elems: IElems,
    binding: IDirectiveBinding<T>,
  ): Array<HTMLElement | RexNode>;

  /** If directive already applyed returns existing transformation result */
  __applySafe(node: RexNode): RexNode[] {
    if (this.__initialized && this.__transformedNode$.value != null) {
      return this.__transformedNode$.value;
    } else {
      return this.__apply(node);
    }
  }

  /** aplly directive to node */
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

    this.__transformedNode$.next(transformed);
    this.__initialized = true;
    return transformed;
  }
}
