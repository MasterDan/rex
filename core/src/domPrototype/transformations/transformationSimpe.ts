import { BehaviorMutable } from '../../tools/rx/BehaviorMutable';
import { BehaviorSubject } from 'rxjs';
import { RexNode } from '../rexNode';
import { Directive } from '../../directives/directive';

export class TransformationSimple {
  private _node = new BehaviorSubject<RexNode | null>(null);
  private _directives = new BehaviorMutable<Directive[] | null>(null);

  setNode(node: RexNode): TransformationSimple {
    this._node.next(node);
    return this;
  }

  pushDirectives(...dirs: Directive[]) {
    this._directives.mutate((old) => {
      const val = old ?? [];
      val.push(...dirs);
      return val;
    });
  }
}
