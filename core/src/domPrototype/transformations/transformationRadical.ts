import {
  BehaviorSubject,
  combineLatest,
  switchMap,
  filter,
  Observable,
} from 'rxjs';
import { RexNode } from '../rexNode';
import { DirectiveStructural } from '../../directives/directiveStructural';
import { DirectiveTransformResult } from '../../directives/directiveBase';
import { IDirectiveDefinition } from 'core/src/directives/@types/DirectiveDefinition';
import { DependencyResolverClassic } from 'core/src/di/dependencyResolverClassic';

export class TransformationRadical extends DependencyResolverClassic {
  private _initialNode$ = new BehaviorSubject<RexNode | null>(null);
  private _mainDirective$ = new BehaviorSubject<DirectiveStructural | null>(
    null,
  );
  size$ = new BehaviorSubject<number>(1);
  positionInParent$ = new BehaviorSubject<number>(0);

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

  private _transformedNodes$ = new BehaviorSubject<RexNode[] | null>(null);

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
