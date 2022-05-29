import { RexNode } from 'core/src/vdom/rexNode';
import { Directive, IDirectiveBinding, IElems } from '../directive';

export class ifDirective extends Directive<boolean> {
  name = 'if';
  frame = /\[if\]/gm;
  init(
    node: RexNode,
    { value }: IDirectiveBinding<boolean>,
  ): RexNode | RexNode[] {
    return value ? node : [];
  }
  update(
    { elements }: IElems,
    { value }: IDirectiveBinding<boolean>,
  ): HTMLElement[] {
    if (value) {
      return elements;
    } else return [];
  }
}
