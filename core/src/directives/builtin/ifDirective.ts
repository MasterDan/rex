import { RexNode } from '../../domPrototype/rexNode';
import { Directive } from '../directive';
import { IDirectiveBinding } from '../@types/IDirectiveBinding';
import { IElems } from '../@types/IElems';

export class ifDirective extends Directive<boolean> {
  name = 'if';
  frame = /\[if\]/gm;

  init(node: RexNode, { value }: IDirectiveBinding<boolean>): RexNode[] {
    return value ? [node] : [];
  }

  update(
    { elements }: IElems,
    { value }: IDirectiveBinding<boolean>,
  ): HTMLElement[] {
    console.log('upddating value', value);
    if (value) {
      return elements;
    } else return [];
  }
}
