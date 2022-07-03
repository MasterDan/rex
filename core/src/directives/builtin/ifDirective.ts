import { RexNode } from '../../domPrototype/rexNode';
import { DirectiveBase, DirectiveTransformResult } from '../directiveBase';
import { IDirectiveBinding } from '../@types/IDirectiveBinding';
import { ElemsWithNode } from '../@types/IElems';

export class ifDirective extends DirectiveBase<boolean> {
  name = 'if';
  frame = /\[if\]/gm;

  init(node: RexNode, { value }: IDirectiveBinding<boolean>): RexNode[] {
    return value ? [node] : [];
  }

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
  }
}
