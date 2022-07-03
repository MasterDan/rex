import { RexNode } from '../../domPrototype/rexNode';
import { DirectiveTransformResult } from '../directiveBase';
import { IDirectiveBinding } from '../@types/IDirectiveBinding';
import { ElemsWithNode } from '../@types/IElems';
import {
  DirectiveStructural,
  IStructuralDirectiveConfig,
} from '../directiveStructural';

export class ifDirective extends DirectiveStructural<boolean> {
  name = 'if';
  frame = /\[if\]/gm;
  config: Partial<IStructuralDirectiveConfig<boolean>> = {
    init(node: RexNode, { value }: IDirectiveBinding<boolean>): RexNode[] {
      return value ? [node] : [];
    },
    update(
      { elements, node }: ElemsWithNode,
      { value }: IDirectiveBinding<boolean>,
    ): DirectiveTransformResult {
      if (value) {
        if (elements.length === 0) {
          return [node];
        }
        return elements;
      } else return [];
    },
  };
}
