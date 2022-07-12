import {
  BehaviorSubject,
  combineLatest,
  switchMap,
  filter,
  distinctUntilChanged,
  Observable,
  map,
} from 'rxjs';
import { RexNode } from '../rexNode';
import { DirectiveStructural } from '../../directives/directiveStructural';
import { DirectiveTransformResult } from '../../directives/directiveBase';
import { IDirectiveDefinition } from 'core/src/directives/@types/DirectiveDefinition';
import { DependencyResolverClassic } from 'core/src/di/dependencyResolverClassic';
import { ElemsWithNode } from 'core/src/directives/@types/IElems';

export class TransformationRadical extends DependencyResolverClassic {
  private _initialNode$ = new BehaviorSubject<RexNode | null>(null);
  private _mainDirective$ = new BehaviorSubject<DirectiveStructural | null>(
    null,
  );
  size$ = new BehaviorSubject<number>(1);
  positionInParent$ = new BehaviorSubject<number>(0);
  mounted$ = new BehaviorSubject<boolean>(false);

  private _validNodeWithStructDirective$: Observable<
    [DirectiveStructural, RexNode]
  > = combineLatest([this._mainDirective$, this._initialNode$]).pipe(
    filter((arr): arr is [DirectiveStructural, RexNode] => {
      const [dir, node] = arr;
      return dir != null && node != null;
    }),
  );

  private _parentNode$: Observable<RexNode | null> =
    this._validNodeWithStructDirective$.pipe(
      switchMap(([_, initialNode]) => initialNode._parentNode$),
    );

  private _parentElement$: Observable<HTMLElement | null> = combineLatest([
    this._validNodeWithStructDirective$,
    this._parentNode$,
  ]).pipe(
    switchMap(([[_, initial], parent]) =>
      parent != null ? parent._htmlElement$ : initial._rootElement$,
    ),
  );

  private _transformedElements$ = combineLatest([
    this._parentElement$.pipe(distinctUntilChanged()),
    this.positionInParent$.pipe(distinctUntilChanged()),
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

  _transformedIElems: Observable<ElemsWithNode> = combineLatest([
    this._validNodeWithStructDirective$,
    this._parentElement$,
    this._transformedElements$,
  ]).pipe(
    map(
      ([[_, initialNode], parent, elems]): ElemsWithNode => ({
        element: elems.length === 1 ? elems[0] : null,
        node: initialNode,
        elements: elems,
        parent,
      }),
    ),
  );

  private _transformedNodes$ = new BehaviorSubject<RexNode[] | null>(null);

  constructor() {
    super();
    /* initial transformation rex-nodes before mount */
    this._validNodeWithStructDirective$
      .pipe(filter(() => !this.mounted$.value))
      .subscribe(([directive, initialNode]) => {
        const transformed = directive.__applySafe(initialNode);
        this._transformedNodes$.next(transformed);
        this.size$.next(transformed.length);
      });
  }

  setNode(node: RexNode): TransformationRadical {
    this._initialNode$.next(node);
    return this;
  }

  defineDirective(definition: IDirectiveDefinition) {
    this.resolve<DirectiveStructural>(definition.name)
      .pipe(filter((d): d is DirectiveStructural => d != null))
      .subscribe((dir) => {
        this._mainDirective$.next(dir);
      });
  }

  private renderResult(nodes: DirectiveTransformResult): HTMLElement[] {
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
  }
}
