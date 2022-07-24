import {
  BehaviorSubject,
  combineLatest,
  filter,
  map,
  Observable,
  skip,
  switchMap,
  take,
  withLatestFrom,
  distinctUntilChanged,
} from 'rxjs';
import { BehaviorMutable } from '../../tools/rx/BehaviorMutable';
import { RexNode } from '../../domPrototype/rexNode';
import { DirectiveBase, DirectiveTransformResult } from '../directiveBase';
import { ElemsWithNode, IElems, INode } from '../@types/IElems';

export class DirectivePipeline {
  /** result size of transformed rex-nodes array
   * or htmlElements array when mounted  */
  public size$ = new BehaviorSubject<number>(1);
  /** Position in parent node
   * depends on size$ of our neighbous with DirectivePipeline in parent node
   * @todo should i make it subject instead of behaviour ?
   */
  public positionInParenNode$ = new BehaviorSubject<number>(0);
  private _directives$ = new BehaviorMutable<DirectiveBase[] | null>(null);
  private _initialNode$ = new BehaviorSubject<RexNode | null>(null);
  /** if we have initalnode and at least one directive */
  private _validState$: Observable<[DirectiveBase[], RexNode]> = combineLatest([
    this._directives$,
    this._initialNode$,
  ]).pipe(
    filter((arr): arr is [DirectiveBase[], RexNode] => {
      const [dirs, node] = arr;
      return dirs != null && node != null && dirs.length > 0;
    }),
  );
  private _transformedNodes$ = new BehaviorSubject<RexNode[] | null>(null);

  /** Should emit when after transformation we only mutated element
   * and not replaced it with something else
   */
  private _isTheSameElement$: Observable<boolean> = this._directives$.pipe(
    filter((val): val is DirectiveBase[] => val != null),
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
  private _transformedSameElement$ = this._transformedNode$.pipe(
    switchMap((node) => node._htmlElement$),
  );
  /** emits [htmlElement] of _transformedNode$
   * or resolves elements[] from _parentElement$ if we not changing single element */
  private _transforemedElements$: Observable<HTMLElement[]> =
    this._isTheSameElement$.pipe(
      switchMap((isSame) => {
        if (isSame) {
          return this._transformedSameElement$.pipe(map((el) => [el]));
        } else {
          return combineLatest([
            this._parentElement$.pipe(distinctUntilChanged()),
            this.positionInParenNode$.pipe(distinctUntilChanged()),
            this.size$.pipe(distinctUntilChanged()),
          ]).pipe(
            map(([parent, position, size]) => {
              if (parent == null) {
                return [];
              }
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
  private _parentNode$: Observable<RexNode | null> = this._validState$.pipe(
    switchMap(([_, initialNode]) => initialNode._parentNode$),
  );
  /** Html element of parent rex node */
  private _parentElement$: Observable<HTMLElement | null> = combineLatest([
    this._initialNode$.pipe(filter((n): n is RexNode => n != null)),
    this._parentNode$,
  ]).pipe(
    switchMap(([current, parent]) =>
      parent != null ? parent._htmlElement$ : current._rootElement$,
    ),
  );

  private _elementsAggregated$: Observable<IElems & INode> = combineLatest([
    this._parentElement$,
    this._transforemedElements$,
    this._initialNode$.pipe(filter((node): node is RexNode => node != null)),
  ]).pipe(
    map(([parent, transformed, node]) => {
      return {
        parent,
        element: transformed.length === 1 ? transformed[0] : null,
        elements: transformed,
        node: node,
      };
    }),
  );

  private _values$: Observable<(string | null)[]> = this._validState$.pipe(
    switchMap(([directives]) =>
      combineLatest(directives.map((dir) => dir.__value$)),
    ),
  );
  mounted$ = new BehaviorSubject<boolean>(false);

  /** if values or elements changed */
  private change$ = combineLatest([this._elementsAggregated$, this._values$]);

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
      .pipe(
        filter(
          (node): node is RexNode => node != null && !node._willChange$.value,
        ),
      )
      .subscribe((parent) => {
        parent._willChange$.next(true);
      });
    /* if we're just mutating single element - then make it updatable */
    this._transformedNode$
      .pipe(filter((node) => !node._willChange$.value))
      .subscribe((node) => {
        // console.log('setting updatable to', node.tag$.value);
        node._willChange$.next(true);
      });
    /* when successfull mounted - setting explicit flag */
    this.mount$.subscribe(() => {
      this.mounted$.next(true);
    });
    /* updating all */
    this.update$
      .pipe(
        withLatestFrom(
          this._directives$.pipe(
            filter((d): d is DirectiveBase[] => d != null),
          ),
        ),
      )
      .subscribe(([[elems, values], directives]) => {
        this.updateAll(elems, values, directives, (d, e) =>
          d.__triggerUpdate(e),
        );
      });
    /* updating all */
    this.mount$
      .pipe(
        withLatestFrom(
          this._directives$.pipe(
            filter((d): d is DirectiveBase[] => d != null),
          ),
        ),
      )
      .subscribe(([[elems, values], directives]) => {
        this.updateAll(elems, values, directives, (d, e) =>
          d.__triggerMounted(e),
        );
      });
  }

  get isEmpty(): boolean {
    const dirs = this._directives$.value;
    return dirs == null || dirs.length === 0;
  }

  /**
   * Applying cureent pipeline to HtmlElements
   * @param elems Result of initial or previous transformation
   * @param values Last value of each directive in pipeline
   * @param directives current directives
   * @param mountOrUpdate triggers mount function or update function in directive
   */
  private updateAll(
    elems: IElems & INode,
    values: (string | null)[],
    directives: DirectiveBase[],
    mountOrUpdate: (
      dir: DirectiveBase,
      elems: ElemsWithNode,
    ) => DirectiveTransformResult,
  ) {
    /**  after previous transformation element was the same */
    let wasTheSameElement = elems.element != null && this.size$.value === 1;
    /** element from previous transformation */
    let previousElement = elems.element;
    let previousTransformation: HTMLElement[] = elems.elements;

    /** support function that renders Raw RexNodes into HtmlElements */
    const renderResult: (nodes: DirectiveTransformResult) => HTMLElement[] = (
      nodes: DirectiveTransformResult,
    ) => {
      const elementsArray: HTMLElement[] = [];
      for (const node of nodes) {
        if (node instanceof RexNode) {
          node.render().subscribe((fragment) => {
            const child = fragment.childNodes[0] as HTMLElement;
            elementsArray.push(child);
          });
        } else {
          elementsArray.push(node);
        }
      }
      return elementsArray;
    };

    for (const i in values) {
      const value = values[i];
      const directive = directives[i];
      if (wasTheSameElement) {
        // apply directive if we need
        if (value != directive.__valueOld$.value) {
          elems.element = previousElement;
          elems.elements = previousTransformation;
          previousTransformation = renderResult(
            mountOrUpdate(directive, elems),
          );
        } else if (directive.__lastTransformation != null) {
          previousTransformation = renderResult(directive.__lastTransformation);
        }
      } else if (directives.length === 1) {
        /* if we have only one directive that strongly modifies our Dom 
         we still can provide it Raw Elements */

        if (value != directive.__valueOld$.value) {
          elems.element = previousElement;
          elems.elements = previousTransformation;
          previousTransformation = renderResult(
            mountOrUpdate(directive, elems),
          );
        } else if (directive.__lastTransformation != null) {
          previousTransformation = renderResult(directive.__lastTransformation);
        }
      } else {
        throw new Error(
          `Cannot apply dom tansformation in pipline: ${directives
            .map((d) => d.name)
            .join(', ')}. Please, separate structural directives`,
        );
      }
      wasTheSameElement =
        this.size$.value === 1 &&
        previousTransformation.length === 1 &&
        !(previousTransformation[0] instanceof RexNode) &&
        previousTransformation[0].nodeName === previousElement?.nodeName;
      if (wasTheSameElement) {
        previousElement = previousTransformation[0] as HTMLElement;
      } else {
        previousElement = null;
      }
    }
    /** if after transformation number of elements somehow changed */
    if (!wasTheSameElement) {
      const position = this.positionInParenNode$.value;
      const oldSize = this.size$.value;
      const newSize = previousTransformation.length;
      const parent = elems.parent;
      if (parent == null) {
        throw new Error('Cannot apply transformation on non mounted Node');
        return;
      }
      if (newSize < oldSize) {
        let diff = oldSize - newSize;
        const lastIndex = position + oldSize - 1;
        let transformationIndex = previousTransformation.length - 1;
        for (let i = lastIndex; i >= position; i--) {
          const child = parent.childNodes[i];
          if (diff > 0) {
            parent.removeChild(child);
            diff--;
          } else {
            const newChild = previousTransformation[transformationIndex];
            parent.replaceChild(newChild, child);
          }
          transformationIndex--;
        }
      } else {
        const lastOldIndex = oldSize - 1;
        for (let i = 0; i < newSize; i++) {
          const child =
            parent.childNodes.length > 0 ? parent.childNodes[i] : null;
          const newChild = previousTransformation[i];
          if (i > lastOldIndex) {
            if (child) {
              parent.insertBefore(child, newChild);
            } else {
              parent.appendChild(newChild);
            }
          } else {
            if (child) {
              parent.replaceChild(newChild, child);
            } else {
              parent.appendChild(newChild);
            }
          }
        }
      }
      this.size$.next(newSize);
    }
  }

  setNode(n: RexNode): DirectivePipeline {
    this._initialNode$.next(n);
    return this;
  }

  pushDirectives(...dirs: DirectiveBase[]): DirectivePipeline {
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
