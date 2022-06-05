import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  skip,
  switchMap,
  take,
  tap,
  withLatestFrom,
} from 'rxjs';
import { BehaviorMutable } from '../tools/rx/BehaviorMutable';
import { RexNode } from '../domPrototype/rexNode';
import { Directive } from './directive';
import { IElems, INode } from './@types/IElems';

export class DirectivePipeline {
  /** result size of transformed rex-nodes array
   * or htmlElements array when mounted  */
  public size$ = new BehaviorSubject<number>(1);
  /** Position in parent node
   * depends on size$ of our neighbous with DirectivePipeline in parent node
   * @todo should i make it subject instead of behaviour ?
   */
  public positionInParenNode$ = new BehaviorSubject<number>(0);
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
  private _transformedSameElement$ = this._transformedNode$
    .pipe(switchMap((node) => node._htmlElement$))
    .pipe(tap((v) => console.log('el is', v)));
  /** emits [htmlElement] of _transformedNode$
   * or resolves elements[] from _parentElement$ if we not changing single element */
  private _transforemenElements$ = this._isTheSameElement$.pipe(
    switchMap((isSame) => {
      if (isSame) {
        return this._transformedSameElement$.pipe(map((el) => [el]));
      } else {
        return combineLatest([
          this._parentElement$,
          this.positionInParenNode$,
          this.size$,
        ]).pipe(
          map(([parent, position, size]) => {
            const childNodes = parent.childNodes;
            const elems: HTMLElement[] = [];
            for (let i = 0; i < size; i++) {
              const element = childNodes[i + position] as HTMLElement;
              elems.push(element);
            }
            return elems;
          }),
        );
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
  private _parentElement$ = this._parentNode$
    .pipe(switchMap((node) => node._htmlElement$))
    .pipe(
      tap((e) => {
        console.log('parent element is', e);
      }),
    );

  private _elementsAggregated$: Observable<IElems & INode> = combineLatest([
    this._parentElement$,
    this._transforemenElements$,
    this._initialNode$.pipe(filter((node): node is RexNode => node != null)),
  ])
    .pipe(
      map(([parent, transformed, node]) => {
        return {
          parent,
          element: transformed.length === 1 ? transformed[0] : null,
          elements: transformed,
          node: node,
        };
      }),
    )
    .pipe(
      tap((ea) => {
        console.log('elems aggregated', ea);
      }),
    );

  private _values$: Observable<(string | null)[]> = this._validState$.pipe(
    switchMap(([directives]) =>
      combineLatest(directives.map((dir) => dir.__value$)),
    ),
    tap((vals) => {
      console.log('values changed', vals);
    }),
  );
  mounted$ = new BehaviorSubject<boolean>(false);

  /** if values or elements changed */
  private change$ = combineLatest([
    this._elementsAggregated$,
    this._values$,
  ]).pipe(tap((state) => console.log('state changed', state)));

  /** first value update is mount */
  private mount$ = this.change$.pipe(take(1));
  /** second and other updates are actually updates */
  private update$ = this.change$.pipe(skip(1));

  constructor() {
    /* initial transformation rex-nodes before mount */
    this._validState$
      .pipe(filter(() => !this.mounted$.value))
      .subscribe(([directives, initialNode]) => {
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
    /* when successfull mounted - setting explicit flag */
    this.mount$.subscribe(() => {
      this.mounted$.next(true);
    });
    /* updating all */
    this.update$
      .pipe(
        withLatestFrom(
          this._directives$.pipe(filter((d): d is Directive[] => d != null)),
        ),
      )
      .subscribe(([[elems, values], directives]) => {
        this.updateAll(elems, values, directives);
      });
    /* updating all */
    this.mount$
      .pipe(
        withLatestFrom(
          this._directives$.pipe(filter((d): d is Directive[] => d != null)),
        ),
      )
      .subscribe(([[elems, values], directives]) => {
        this.mountAll(elems, values, directives);
      });
  }

  get isEmpty(): boolean {
    const dirs = this._directives$.value;
    return dirs == null || dirs.length === 0;
  }

  private updateAll(
    elems: IElems & INode,
    values: (string | null)[],
    directives: Directive[],
  ) {
    /* element exists, therefore we're mutating single element */
    if (elems.element != null) {
      for (const i in values) {
        const value = values[i];
        const directive = directives[i];
        if (value != directive.__value$.value) {
          directive.__triggerUpdate(elems);
        }
      }
    } else {
      // here will be if and for logick
    }
  }

  private mountAll(
    elems: IElems & INode,
    values: (string | null)[],
    directives: Directive[],
  ) {
    /* element exists, therefore we're mutating single element */
    if (elems.element != null) {
      for (const i in values) {
        const value = values[i];
        const directive = directives[i];
        if (value != directive.__value$.value) {
          directive.__triggerMounted(elems);
        }
      }
    } else {
      // here will be if and for logick
    }
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
