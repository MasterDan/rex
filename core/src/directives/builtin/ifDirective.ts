import { RexNode } from '../../domPrototype/rexNode';
import { Directive, DirectiveTransformResult } from '../directive';
import { IDirectiveBinding } from '../@types/IDirectiveBinding';
import { ElemsWithNode } from '../@types/IElems';

export class ifDirective extends Directive<boolean> {
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
