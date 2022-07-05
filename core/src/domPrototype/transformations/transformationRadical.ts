import { BehaviorSubject, combineLatest, filter, Observable } from 'rxjs';
import { RexNode } from '../rexNode';
import { DirectiveStructural } from '../../directives/directiveStructural';
import { DirectiveTransformResult } from '../../directives/directiveBase';

export class TransformationRadical {
  private _node$ = new BehaviorSubject<RexNode | null>(null);
  private _mainDirective$ = new BehaviorSubject<DirectiveStructural | null>(
    null,
  );
  size$ = new BehaviorSubject<number>(1);
  positionInParent$ = new BehaviorSubject<number>(0);

  private _validState$: Observable<[DirectiveStructural, RexNode]> =
    combineLatest([this._mainDirective$, this._node$]).pipe(
      filter((arr): arr is [DirectiveStructural, RexNode] => {
        const [dir, node] = arr;
        return dir != null && node != null;
      }),
    );

  private _transformedNodes$ = new BehaviorSubject<RexNode[] | null>(null);

  setNode(node: RexNode): TransformationRadical {
    this._node$.next(node);
    return this;
  }

  setDirective(dir: DirectiveStructural) {
    this._mainDirective$.next(dir);
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
