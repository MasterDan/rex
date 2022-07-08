import { BehaviorMutable } from '../../tools/rx/BehaviorMutable';
import { BehaviorSubject, combineLatest, filter, Observable } from 'rxjs';
import { RexNode } from '../rexNode';
import { Directive } from '../../directives/directive';

export class TransformationSimple {
  private _initialNode$ = new BehaviorSubject<RexNode | null>(null);
  private _directives$ = new BehaviorMutable<Directive[] | null>(null);

  private _validNodeWithDirectives$: Observable<[Directive[], RexNode]> =
    combineLatest([this._directives$, this._initialNode$]).pipe(
      filter((arr): arr is [Directive[], RexNode] => {
        const [dirs, node] = arr;
        return dirs != null && node != null && dirs.length > 0;
      }),
    );

  setNode(node: RexNode): TransformationSimple {
    this._initialNode$.next(node);
    return this;
  }

  pushDirectives(...dirs: Directive[]) {
    this._directives$.mutate((old) => {
      const val = old ?? [];
      val.push(...dirs);
      return val;
    });
  }
}
