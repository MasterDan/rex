import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  of,
  switchMap,
  take,
} from 'rxjs';
import { BehaviorMutable } from '../tools/rx/BehaviorMutable';
import { RexNode } from '../domPrototype/rexNode';
import { Directive } from './directive';

export class DirectivePipeline {
  /** result size of transformed rex-nodes array
   * or htmlElements array when mounted  */
  public size$ = new BehaviorSubject<number>(1);
  /** Position in parent node
   * depends on size$ of our neighbous with DirectivePipeline in parent node
   */
  public positionInParenNode$ = new BehaviorSubject<number>(1);
  private _directives$ = new BehaviorMutable<Directive[] | null>(null);
  private _initialNode$ = new BehaviorSubject<RexNode | null>(null);
  /** if we have initalnode and at least one directive */
  private _validState$: Observable<[Directive[], RexNode]> = combineLatest([
    this._directives$,
    this._initialNode$,
  ]).pipe(
    filter((arr): arr is [Directive[], RexNode] => {
      const [dirs, node] = arr;
      return dirs != null && node != null && dirs.length > 0;
    }),
  );
  private _transformedNodes$ = new BehaviorSubject<RexNode[] | null>(null);

  /** Should emit when after transformation we only mutated element
   * and not replaced it with something else
   */
  private _isTheSameElement$: Observable<boolean> = this._directives$.pipe(
    filter((val): val is Directive[] => val != null),
    switchMap((dirs) =>
      combineLatest(dirs.map((dir) => dir.__isTheSameElement$)),
    ),
    map((bools) => bools.every((b) => b === true)),
  );
  /**
   * Emits single rex node if we just changing single element
   * otherwise not
   */
  private _transformedNode$: Observable<RexNode> = combineLatest([
    this._transformedNodes$,
    this._isTheSameElement$,
  ]).pipe(
    filter((args): args is [RexNode[], boolean] => {
      const [nodes, isSame] = args;
      return isSame && nodes != null && nodes.length === 1;
    }),
    map(([[node]]) => node),
  );
  /** emits htmlElement of _transformedNode$ */
  private _transformedElement$ = this._transformedNode$.pipe(
    switchMap((node) => node._htmlElement$),
  );
  /** emits htmlElement of _transformedNode$ or null if we not changing single element */
  private _transforemenElementNullable$ = this._isTheSameElement$.pipe(
    switchMap((isSame) => {
      if (isSame) {
        return this._transformedElement$;
      } else {
        return of(null);
      }
    }),
  );
  /** Parent of Initial rex node
   * In case if our element/node appears or disapperas
   */
  private _parentNode$ = this._validState$.pipe(
    switchMap(([_, initialNode]) => initialNode._parentNode$),
    filter((v): v is RexNode => v != null),
  );
  /** Html element of parent rex node */
  private _parentElement$ = this._parentNode$.pipe(
    switchMap((node) => node._htmlElement$),
  );

  private _elementsAggregated$ = combineLatest([
    this._parentElement$,
    this._transforemenElementNullable$,
  ]).pipe(
    map(([parent, transformed]) => {
      return {
        parent,
        transformed,
      };
    }),
  );

  private _values$ = this._validState$.pipe(
    switchMap(([directives]) =>
      combineLatest(directives.map((dir) => dir.__value$)),
    ),
  );

  constructor() {
    /* initial transformation */
    this._validState$.subscribe(([directives, initialNode]) => {
      let transformationStep = directives[0].__applySafe(initialNode);
      for (let i = 1; i < directives.length; i++) {
        const currentDir = directives[i];
        const transformedNodes = transformationStep.map((node) => {
          const transformed = currentDir.__applySafe(node);
          return transformed;
        });
        transformationStep =
          transformedNodes.length > 0
            ? transformedNodes.reduce((a, c) => a.concat(c))
            : (transformedNodes as []);
      }
      this._transformedNodes$.next(transformationStep);
      this.size$.next(transformationStep.length);
    });
    /* always mark parent of initial transformation node as updatable */
    this._parentNode$
      .pipe(filter((node) => !node._updatable$.value))
      .subscribe((parent) => {
        parent._updatable$.next(true);
      });
    /* if we're just mutating single element - then make it updatable */
    this._transformedNode$
      .pipe(filter((node) => !node._updatable$.value))
      .subscribe((node) => {
        node._updatable$.next(true);
      });
  }

  get isEmpty(): boolean {
    const dirs = this._directives$.value;
    return dirs == null || dirs.length === 0;
  }

  setNode(n: RexNode): DirectivePipeline {
    this._initialNode$.next(n);
    return this;
  }

  pushDirectives(...dirs: Directive[]): DirectivePipeline {
    this._directives$.mutate((old) => {
      const newDirs = old ?? [];
      newDirs.push(...dirs);
      return newDirs;
    });
    return this;
  }

  get transformedNodes$(): Observable<RexNode[]> {
    return this._transformedNodes$.pipe(
      filter((n): n is RexNode[] => n != null),
      take(1),
    );
  }
}
